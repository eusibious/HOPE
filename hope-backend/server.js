import "dotenv/config";
import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import nodemailer from "nodemailer";
import axios from "axios";
import FormData from "form-data";
import dns from "dns/promises";
import crypto from "crypto";
import { ethers } from "ethers";

// ─── Firebase Admin Initialization ───────────────────────────────────────────
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT is missing.");
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch {
  throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON.");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

const HARDHAT_RPC_URL = process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545";
const BENEFICIARY_SECRET = process.env.BENEFICIARY_SECRET || "change-this-in-env";

// ─── Nodemailer Transporter ──────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ─── Express Setup ───────────────────────────────────────────────────────────
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ─── Error Class ─────────────────────────────────────────────────────────────
class ClientInputError extends Error {
  constructor(message, code = "invalid-beneficiary-row") {
    super(message);
    this.name = "ClientInputError";
    this.code = code;
  }
}

// ─── Contract Read Helpers ───────────────────────────────────────────────────
const HOPE_CAMPAIGN_READ_ABI = [
  "function getCampaignDetails() view returns (address _partner, string _title, string _location, uint256 _goalAmount, uint256 _raisedAmount, uint256 _deadline, uint256 _beneficiaryCount, uint256 _claimedCount, bool _isActive, bool _beneficiariesLocked, string _documentCID)",
  "event BeneficiariesRegistered(uint256 count, string ipfsCID, uint256 timestamp)",
];

const getCampaignReadContract = (campaignAddress) => {
  const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
  return new ethers.Contract(campaignAddress, HOPE_CAMPAIGN_READ_ABI, provider);
};

// ─── Generic Helpers ─────────────────────────────────────────────────────────
const buildError = (res, status, code, message, extra = {}) => {
  return res.status(status).json({
    success: false,
    code,
    message,
    ...extra,
  });
};

const getCampaignDocByAddress = async (campaignAddress) => {
  const snapshot = await db
    .collection("campaigns")
    .where("campaignAddress", "==", campaignAddress)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  return {
    id: snapshot.docs[0].id,
    ref: snapshot.docs[0].ref,
    data: snapshot.docs[0].data(),
  };
};

// ─── Auth Middleware ─────────────────────────────────────────────────────────
const verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized. No token provided." });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decoded = await auth.verifyIdToken(idToken);
    const userDoc = await db.collection("users").doc(decoded.uid).get();

    if (!userDoc.exists || userDoc.data()?.role !== 1) {
      return res.status(403).json({ error: "Forbidden. Admin access only." });
    }

    req.adminUid = decoded.uid;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }
};

const verifyPartner = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized. No token provided." });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decoded = await auth.verifyIdToken(idToken);
    const userDoc = await db.collection("users").doc(decoded.uid).get();

    if (!userDoc.exists) {
      return res.status(403).json({ error: "User record not found." });
    }

    const userData = userDoc.data();

    if (userData?.role !== 2) {
      return res.status(403).json({ error: "Forbidden. Partner access only." });
    }

    if (userData?.status !== "active") {
      return res.status(403).json({ error: "Partner account is not active." });
    }

    req.partnerUid = decoded.uid;
    req.partnerData = userData;
    next();
  } catch (error) {
    console.error("verifyPartner failed:", error);
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }
};

// ─── Beneficiary Helpers ─────────────────────────────────────────────────────
const normalizePhone = (phone = "") => {
  return String(phone).replace(/\D/g, "");
};

const normalizeGovId = (govId = "") => {
  return String(govId).trim().toUpperCase().replace(/\s+/g, "");
};

const generateClaimCode = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

const generateClaimHash = ({ campaignAddress, phone, governmentId }) => {
  const raw = [
    String(campaignAddress).toLowerCase(),
    normalizePhone(phone),
    normalizeGovId(governmentId),
    BENEFICIARY_SECRET,
  ].join("|");

  return ethers.keccak256(ethers.toUtf8Bytes(raw));
};

const sanitizeAidAmount = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
    throw new ClientInputError(
      "Aid amount must be a valid positive number with up to 2 decimals."
    );
  }

  return raw;
};

const validateBeneficiaryRow = (item, index) => {
  const fullName = String(item?.fullName || "").trim();
  const phone = normalizePhone(item?.phone || "");
  const governmentId = normalizeGovId(item?.governmentId || "");
  const aidAmount = sanitizeAidAmount(item?.aidAmount || "");

  if (!fullName) {
    throw new ClientInputError(`Beneficiary ${index + 1}: fullName is required.`);
  }

  if (!phone || phone.length < 6) {
    throw new ClientInputError(`Beneficiary ${index + 1}: valid phone is required.`);
  }

  if (!governmentId) {
    throw new ClientInputError(`Beneficiary ${index + 1}: governmentId is required.`);
  }

  return {
    fullName,
    phone,
    governmentId,
    normalizedPhone: phone,
    normalizedGovernmentId: governmentId,
    aidAmount,
  };
};

const getExistingCampaignBeneficiaries = async (campaignId) => {
  const snapshot = await db
    .collection("campaigns")
    .doc(campaignId)
    .collection("beneficiaries")
    .get();

  return snapshot.docs.map((doc) => doc.data());
};

const uploadJsonToIPFS = async (jsonData, fileName = "beneficiaries.json") => {
  try {
    const buffer = Buffer.from(JSON.stringify(jsonData, null, 2));

    const formData = new FormData();
    formData.append("file", buffer, {
      filename: fileName,
      contentType: "application/json",
    });

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          ...formData.getHeaders(),
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_API_SECRET,
        },
      }
    );

    return response.data.IpfsHash;
  } catch (error) {
    console.error("JSON IPFS upload failed:", error.response?.data || error.message);
    throw new Error("Beneficiary manifest upload failed");
  }
};

// ─── Transaction Verification Helpers ────────────────────────────────────────
const verifyTransactionReceipt = async (txHash, expectedTo) => {
  const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
  const receipt = await provider.getTransactionReceipt(txHash);

  if (!receipt) {
    throw new Error("Transaction receipt not found yet.");
  }

  if (receipt.status !== 1) {
    throw new Error("Transaction failed on-chain.");
  }

  if (!receipt.to || receipt.to.toLowerCase() !== expectedTo.toLowerCase()) {
    throw new Error("Transaction target does not match campaign address.");
  }

  return receipt;
};

const verifyBeneficiaryRegistrationReceipt = async (
  txHash,
  expectedTo,
  expectedCount,
  expectedManifestCID
) => {
  const receipt = await verifyTransactionReceipt(txHash, expectedTo);
  const iface = new ethers.Interface(HOPE_CAMPAIGN_READ_ABI);

  let matched = false;

  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);

      if (parsed?.name === "BeneficiariesRegistered") {
        const count = Number(parsed.args.count);
        const ipfsCID = parsed.args.ipfsCID;

        if (count !== expectedCount) {
          throw new Error("Registration count in event does not match prepared session.");
        }

        if (ipfsCID !== expectedManifestCID) {
          throw new Error("Manifest CID in event does not match prepared session.");
        }

        matched = true;
        break;
      }
    } catch {
      // Ignore unrelated logs
    }
  }

  if (!matched) {
    throw new Error("BeneficiariesRegistered event not found in transaction receipt.");
  }

  return receipt;
};

// ─── POST /api/approve-partner ───────────────────────────────────────────────
app.post("/api/approve-partner", verifyAdmin, async (req, res) => {
  const { partnerId } = req.body;

  if (!partnerId) {
    return res.status(400).json({ error: "partnerId is required." });
  }

  const partnerRef = db.collection("partner-requests").doc(partnerId);
  const partnerDoc = await partnerRef.get();

  if (!partnerDoc.exists) {
    return res.status(404).json({ error: "Partner request not found." });
  }

  const partner = partnerDoc.data();

  if (partner.status !== "approved") {
    return res.status(400).json({ error: "Partner request is not approved." });
  }

  if (partner.accountCreated === true) {
    return res.status(200).json({
      success: true,
      message: "Account already exists.",
      firebaseUid: partner.firebaseUid,
    });
  }

  try {
    let userRecord;

    try {
      userRecord = await auth.createUser({
        email: partner.email,
        password: generateTemporaryPassword(),
        displayName: partner.contactName || partner.organizationName,
        emailVerified: false,
        disabled: false,
      });
      console.log(`Firebase Auth user created. uid=${userRecord.uid}`);
    } catch (authError) {
      if (authError.code === "auth/email-already-exists") {
        console.warn(`Auth user already exists, reusing. email=${partner.email}`);
        userRecord = await auth.getUserByEmail(partner.email);
      } else {
        throw authError;
      }
    }

    const uid = userRecord.uid;

    await db.collection("users").doc(uid).set({
      uid,
      role: 2,
      email: partner.email,
      organizationName: partner.organizationName || "",
      contactName: partner.contactName || "",
      phone: partner.phone || "",
      description: partner.description || "",
      status: "active",
      partnerRequestId: partnerId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Partner document written to users collection. uid=${uid}`);

    const actionCodeSettings = {
      url: process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/login`
        : "http://localhost:5173/login",
      handleCodeInApp: false,
    };

    const resetLink = await auth.generatePasswordResetLink(
      partner.email,
      actionCodeSettings
    );

    console.log(`Password reset link generated for ${partner.email}`);

    await transporter.sendMail({
      from: `"HOPE Platform" <${process.env.EMAIL_USER}>`,
      to: partner.email,
      subject: "Welcome to HOPE — Set your password to get started",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1E3A8A; margin: 0;">HOPE</h1>
            <p style="color: #6B7280; margin: 4px 0 0;">Humanitarian Aid Platform</p>
          </div>

          <h2 style="color: #111827;">Your Partner Account Has Been Approved</h2>

          <p style="color: #374151;">Dear ${partner.contactName || partner.organizationName},</p>

          <p style="color: #374151;">
            Congratulations! Your organisation <strong>${partner.organizationName}</strong>
            has been approved as a partner on the HOPE platform.
          </p>

          <p style="color: #374151;">
            Click the button below to set your password and access your account:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}"
               style="background-color: #1E3A8A; color: #ffffff; padding: 14px 28px;
                      text-decoration: none; border-radius: 8px; font-weight: bold;
                      font-size: 16px; display: inline-block;">
              Set My Password
            </a>
          </div>

          <div style="background-color: #F3F4F6; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #374151; font-size: 14px;">
              <strong>Your login email:</strong> ${partner.email}
            </p>
          </div>

          <p style="color: #6B7280; font-size: 14px;">
            This link will expire in <strong>1 hour</strong>. If it expires, use the
            "Forgot password" option on the login page to get a new one.
          </p>

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">

          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
            This is an automated message from the HOPE platform. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    console.log(`Welcome email sent to ${partner.email}`);

    await partnerRef.update({
      accountCreated: true,
      accountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
      firebaseUid: uid,
      accountCreationError: admin.firestore.FieldValue.delete(),
      accountCreationErrorAt: admin.firestore.FieldValue.delete(),
    });

    console.log(`Partner approval complete. uid=${uid}, partnerId=${partnerId}`);

    return res.status(200).json({
      success: true,
      message: "Partner account created and welcome email sent.",
      firebaseUid: uid,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Account creation failed. partnerId=${partnerId}`, error);

    await partnerRef.update({
      accountCreationError: message,
      accountCreationErrorAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(500).json({ error: message });
  }
});

// ─── POST /api/upload-ipfs ───────────────────────────────────────────────────
app.post("/api/upload-ipfs", async (req, res) => {
  try {
    const { fileBase64, fileName } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ error: "No file provided" });
    }

    const buffer = Buffer.from(fileBase64, "base64");

    const formData = new FormData();
    formData.append("file", buffer, fileName || "document");

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          ...formData.getHeaders(),
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_API_SECRET,
        },
      }
    );

    return res.status(200).json({
      success: true,
      cid: response.data.IpfsHash,
    });
  } catch (error) {
    console.error("IPFS upload failed FULL ERROR:", error.response?.data || error.message);
    return res.status(500).json({ error: "IPFS upload failed" });
  }
});

// ─── POST /api/beneficiaries/prepare-registration ────────────────────────────
app.post("/api/beneficiaries/prepare-registration", verifyPartner, async (req, res) => {
  try {
    const { campaignAddress, beneficiaries } = req.body;

    if (!campaignAddress || !ethers.isAddress(campaignAddress)) {
      return buildError(res, 400, "campaign-not-found", "Valid campaignAddress is required.");
    }

    if (!Array.isArray(beneficiaries) || beneficiaries.length === 0) {
      return buildError(res, 400, "invalid-beneficiary-row", "At least one beneficiary is required.");
    }

    const campaignDoc = await getCampaignDocByAddress(campaignAddress);

    if (!campaignDoc) {
      return buildError(res, 404, "campaign-not-found", "Campaign not found.");
    }

    if (campaignDoc.data.partnerUid !== req.partnerUid) {
      return buildError(res, 403, "campaign-not-owned", "You do not own this campaign.");
    }

    if (campaignDoc.data.status === "closed") {
      return buildError(res, 400, "campaign-not-active", "Cannot register beneficiaries for a closed campaign.");
    }

    const contract = getCampaignReadContract(campaignAddress);
    const details = await contract.getCampaignDetails();

    if (!details._isActive) {
      return buildError(res, 400, "campaign-not-active", "Campaign is not active on-chain.");
    }

    if (details._beneficiariesLocked) {
      return buildError(res, 400, "beneficiaries-already-locked", "Beneficiaries are already locked for this campaign.");
    }

    const existing = await getExistingCampaignBeneficiaries(campaignDoc.id);

    const existingGovIds = new Set(
      existing.map((b) => b.normalizedGovernmentId).filter(Boolean)
    );

    const existingPhones = new Set(
      existing.map((b) => b.normalizedPhone).filter(Boolean)
    );

    const existingClaimHashes = new Set(
      existing.map((b) => b.claimHash).filter(Boolean)
    );

    const seenGovIds = new Set();
    const seenPhones = new Set();
    const seenClaimHashes = new Set();

    const preparedRows = beneficiaries.map((item, index) => {
      const cleaned = validateBeneficiaryRow(item, index);

      const claimHash = generateClaimHash({
        campaignAddress,
        phone: cleaned.normalizedPhone,
        governmentId: cleaned.normalizedGovernmentId,
      });

      if (
        seenGovIds.has(cleaned.normalizedGovernmentId) ||
        existingGovIds.has(cleaned.normalizedGovernmentId)
      ) {
        throw new ClientInputError(
          `Duplicate beneficiary governmentId detected at row ${index + 1}.`
        );
      }

      if (
        seenPhones.has(cleaned.normalizedPhone) ||
        existingPhones.has(cleaned.normalizedPhone)
      ) {
        throw new ClientInputError(
          `Duplicate beneficiary phone detected at row ${index + 1}.`
        );
      }

      if (
        seenClaimHashes.has(claimHash) ||
        existingClaimHashes.has(claimHash)
      ) {
        throw new ClientInputError(
          `Duplicate beneficiary claimHash detected at row ${index + 1}.`
        );
      }

      seenGovIds.add(cleaned.normalizedGovernmentId);
      seenPhones.add(cleaned.normalizedPhone);
      seenClaimHashes.add(claimHash);

      return {
        ...cleaned,
        claimHash,
        claimCode: generateClaimCode(),
      };
    });

    const generatedAt = new Date().toISOString();

    const manifestPayload = {
      campaignAddress,
      generatedAt,
      count: preparedRows.length,
      beneficiaries: preparedRows.map((b) => ({
        claimHash: b.claimHash,
        aidAmount: b.aidAmount || "",
        registeredAt: generatedAt,
      })),
    };

    const manifestCID = await uploadJsonToIPFS(
      manifestPayload,
      `beneficiaries-${campaignAddress}-${Date.now()}.json`
    );

    const registrationBatchId = crypto.randomBytes(16).toString("hex");

    await db.collection("beneficiaryRegistrationSessions").doc(registrationBatchId).set({
      registrationBatchId,
      campaignAddress,
      campaignId: campaignDoc.id,
      partnerUid: req.partnerUid,
      manifestCID,
      claimHashes: preparedRows.map((b) => b.claimHash),
      beneficiaries: preparedRows,
      count: preparedRows.length,
      status: "prepared",
      txHash: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      committedAt: null,
      error: null,
    });

    return res.status(200).json({
      success: true,
      registrationBatchId,
      manifestCID,
      claimHashes: preparedRows.map((b) => b.claimHash),
      count: preparedRows.length,
    });
  } catch (error) {
    console.error("Prepare registration failed:", error);

    if (error instanceof ClientInputError) {
      return buildError(
        res,
        400,
        error.code || "invalid-beneficiary-row",
        error.message
      );
    }

    return buildError(
      res,
      500,
      "prepare-failed",
      error?.message || "Prepare registration failed."
    );
  }
});

// ─── POST /api/beneficiaries/commit-registration ─────────────────────────────
app.post("/api/beneficiaries/commit-registration", verifyPartner, async (req, res) => {
  try {
    const { campaignAddress, registrationBatchId, txHash } = req.body;

    if (!campaignAddress || !ethers.isAddress(campaignAddress)) {
      return buildError(res, 400, "campaign-not-found", "Valid campaignAddress is required.");
    }

    if (!registrationBatchId || !txHash) {
      return buildError(
        res,
        400,
        "registration-commit-failed",
        "registrationBatchId and txHash are required."
      );
    }

    const campaignDoc = await getCampaignDocByAddress(campaignAddress);

    if (!campaignDoc) {
      return buildError(res, 404, "campaign-not-found", "Campaign not found.");
    }

    if (campaignDoc.data.partnerUid !== req.partnerUid) {
      return buildError(res, 403, "campaign-not-owned", "You do not own this campaign.");
    }

    const sessionRef = db.collection("beneficiaryRegistrationSessions").doc(registrationBatchId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      return buildError(res, 404, "registration-commit-failed", "Registration session not found.");
    }

    const session = sessionSnap.data();

    if (
      session.partnerUid !== req.partnerUid ||
      session.campaignAddress.toLowerCase() !== campaignAddress.toLowerCase()
    ) {
      return buildError(
        res,
        403,
        "forbidden",
        "Registration session does not belong to this campaign/user."
      );
    }

    if (session.txHash && session.txHash !== txHash) {
      return buildError(
        res,
        409,
        "registration-commit-failed",
        "This session is already associated with a different transaction."
      );
    }

    if (session.status === "committed") {
      if (session.txHash !== txHash) {
        return buildError(
          res,
          409,
          "registration-commit-failed",
          "Session already committed with a different transaction."
        );
      }

      return res.status(200).json({
        success: true,
        manifestCID: session.manifestCID,
        txHash: session.txHash,
        count: session.count,
      });
    }

    await verifyBeneficiaryRegistrationReceipt(
      txHash,
      campaignAddress,
      session.count,
      session.manifestCID
    );

    const batch = db.batch();

    for (const beneficiary of session.beneficiaries) {
      const ref = db
        .collection("campaigns")
        .doc(campaignDoc.id)
        .collection("beneficiaries")
        .doc(beneficiary.claimHash);

      batch.set(
        ref,
        {
          campaignAddress,
          campaignId: campaignDoc.id,
          partnerUid: req.partnerUid,
          fullName: beneficiary.fullName,
          phone: beneficiary.phone,
          governmentId: beneficiary.governmentId,
          normalizedPhone: beneficiary.normalizedPhone,
          normalizedGovernmentId: beneficiary.normalizedGovernmentId,
          aidAmount: beneficiary.aidAmount || "",
          claimHash: beneficiary.claimHash,
          claimCode: beneficiary.claimCode || null,
          manifestCID: session.manifestCID,
          registrationTxHash: txHash,
          registrationBatchId,
          status: "registered",
          claimed: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: null,
        },
        { merge: true }
      );
    }

    batch.update(campaignDoc.ref, {
      beneficiaryManifestCID: session.manifestCID,
      beneficiaryRegistrationVersion: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    batch.update(sessionRef, {
      status: "committed",
      txHash,
      committedAt: admin.firestore.FieldValue.serverTimestamp(),
      error: null,
    });

    await batch.commit();

    return res.status(200).json({
      success: true,
      count: session.count,
      manifestCID: session.manifestCID,
      txHash,
    });
  } catch (error) {
    console.error("Commit registration failed:", error);

    const { registrationBatchId, txHash } = req.body || {};

    if (registrationBatchId) {
      await db.collection("beneficiaryRegistrationSessions").doc(registrationBatchId).set(
        {
          status: "commit_failed",
          error: error?.message || "Commit failed",
          txHash: txHash || null,
        },
        { merge: true }
      );
    }

    return buildError(
      res,
      500,
      "reconciliation-required",
      error?.message || "Blockchain may have succeeded but Firestore commit failed."
    );
  }
});

// ─── POST /api/beneficiaries/commit-lock ─────────────────────────────────────
app.post("/api/beneficiaries/commit-lock", verifyPartner, async (req, res) => {
  try {
    const { campaignAddress, txHash } = req.body;

    if (!campaignAddress || !ethers.isAddress(campaignAddress)) {
      return buildError(res, 400, "campaign-not-found", "Valid campaignAddress is required.");
    }

    if (!txHash) {
      return buildError(res, 400, "lock-commit-failed", "txHash is required.");
    }

    const campaignDoc = await getCampaignDocByAddress(campaignAddress);

    if (!campaignDoc) {
      return buildError(res, 404, "campaign-not-found", "Campaign not found.");
    }

    if (campaignDoc.data.partnerUid !== req.partnerUid) {
      return buildError(res, 403, "campaign-not-owned", "You do not own this campaign.");
    }

    await verifyTransactionReceipt(txHash, campaignAddress);

    const contract = getCampaignReadContract(campaignAddress);
    const details = await contract.getCampaignDetails();

    if (!details._beneficiariesLocked) {
      throw new Error("On-chain lock state is still false after transaction.");
    }

    await campaignDoc.ref.update({
      beneficiariesLocked: true,
      beneficiariesLockedAt: admin.firestore.FieldValue.serverTimestamp(),
      beneficiaryLockTxHash: txHash,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      txHash,
    });
  } catch (error) {
    console.error("Commit lock failed:", error);
    return buildError(
      res,
      500,
      "lock-commit-failed",
      error?.message || "Lock commit failed."
    );
  }
});

// ─── POST /api/validate-email-domain ─────────────────────────────────────────
app.post("/api/validate-email-domain", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        valid: false,
        message: "Email is required.",
      });
    }

    if (!isValidEmailFormat(email)) {
      return res.status(400).json({
        valid: false,
        message: "Invalid email format.",
      });
    }

    const domainIsValid = await hasValidMailDomain(email);

    if (!domainIsValid) {
      return res.status(400).json({
        valid: false,
        message: "Email domain is invalid or cannot receive mail.",
      });
    }

    return res.status(200).json({
      valid: true,
      message: "Email domain is valid.",
    });
  } catch (error) {
    console.error("Email domain validation failed:", error);
    return res.status(500).json({
      valid: false,
      message: "Unable to validate email domain right now.",
    });
  }
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/env-check", (req, res) => {
  res.json({
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME,
    pinata: process.env.PINATA_API_KEY ? "OK" : "Missing",
  });
});

// ─── Helper: Email Validation ────────────────────────────────────────────────
function isValidEmailFormat(email) {
  if (!email || typeof email !== "string") return false;

  const value = email.trim().toLowerCase();

  if (value.length > 254) return false;
  if (value.includes(" ")) return false;
  if (!value.includes("@")) return false;

  const parts = value.split("@");
  if (parts.length !== 2) return false;

  const [local, domain] = parts;

  if (!local || !domain) return false;
  if (local.length > 64) return false;
  if (local.includes("..") || domain.includes("..")) return false;
  if (local.startsWith(".") || local.endsWith(".")) return false;
  if (domain.startsWith(".") || domain.endsWith(".")) return false;
  if (!domain.includes(".")) return false;

  const domainParts = domain.split(".");
  if (domainParts.some((part) => !part)) return false;

  const tld = domainParts[domainParts.length - 1];
  if (!/^[a-z]{2,}$/i.test(tld)) return false;

  const localRegex = /^[a-z0-9._%+-]+$/i;
  const domainRegex = /^[a-z0-9.-]+$/i;

  if (!localRegex.test(local)) return false;
  if (!domainRegex.test(domain)) return false;

  return true;
}

async function hasValidMailDomain(email) {
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return false;

  try {
    const mxRecords = await dns.resolveMx(domain);
    return Array.isArray(mxRecords) && mxRecords.length > 0;
  } catch {
    return false;
  }
}

// ─── Helper: generateTemporaryPassword ───────────────────────────────────────
function generateTemporaryPassword() {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  const required = ["A", "a", "0", "!"];
  const random = Array.from({ length: 20 }, () =>
    charset.charAt(Math.floor(Math.random() * charset.length))
  );

  return [...required, ...random].sort(() => Math.random() - 0.5).join("");
}

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`HOPE backend server running on port ${PORT}`);
});