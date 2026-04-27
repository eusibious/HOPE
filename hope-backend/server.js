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
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS ;

const activityProvider = () => new ethers.JsonRpcProvider(HARDHAT_RPC_URL);

const getFactoryContract = () => {
  return new ethers.Contract(
    FACTORY_ADDRESS,
     HOPE_CAMPAIGN_READ_ABI,
    activityProvider()
  );
};

const formatUSDC = (v) => Number(ethers.formatUnits(v || 0, 6));

const shortAddress = (addr = "") =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "—";

const getRelativeTime = (ts) => {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const readBlockTimestamp = async (provider, blockNumber, cache) => {
  if (cache.has(blockNumber)) return cache.get(blockNumber);
  const block = await provider.getBlock(blockNumber);
  const ts = block?.timestamp || 0;
  cache.set(blockNumber, ts);
  return ts;
};

//converts event into readable form
const normalizeEvent = async ({ provider, event, campaign, cache }) => {
  const ts = await readBlockTimestamp(provider, event.blockNumber, cache);

  const base = {
    id: `${event.transactionHash}-${event.index}`,
    campaignAddress: campaign.campaignAddress,
    campaignTitle: campaign.title || "Untitled",
    txHash: event.transactionHash,
    blockNumber: event.blockNumber,
    timestamp: ts,
    relativeTime: getRelativeTime(ts),
  };

  const name = event.fragment?.name;

  if (name === "CampaignCreated") {
    return {
      ...base,
      type: "lifecycle",
      title: "Campaign created",
      subtitle: `Created by ${shortAddress(event.args.partner)}`,
      badge: "Create",
      tone: "blue",
    };
  }

  if (name === "DonationReceived") {
    const amt = formatUSDC(event.args.amount);
    return {
      ...base,
      type: "donation",
      title: "Donation received",
      subtitle: shortAddress(event.args.donor),
      amount: amt,
      amountLabel: `+$${amt}`,
      badge: "Donation",
      tone: "green",
    };
  }

  if (name === "BeneficiariesRegistered") {
    return {
      ...base,
      type: "registration",
      title: "Beneficiaries registered",
      subtitle: `${Number(event.args.count)} beneficiaries`,
      badge: "Register",
      tone: "purple",
    };
  }

  if (name === "BeneficiariesRegisteredAndLocked") {
    return {
      ...base,
      type: "lifecycle",
      title: "Beneficiaries registered & locked",
      subtitle: `${Number(event.args.count)} beneficiaries`,
      badge: "Lock",
      tone: "purple",
    };
  }

  if (name === "BeneficiariesLocked") {
    return {
      ...base,
      type: "lifecycle",
      title: "Beneficiaries locked",
      subtitle: `${Number(event.args.count)} beneficiaries`,
      badge: "Lock",
      tone: "purple",
    };
  }

  if (name === "FundsClaimed") {
    const amt = formatUSDC(event.args.amount);
    return {
      ...base,
      type: "claim",
      title: "Claim processed",
      subtitle: "Beneficiary claimed",
      amount: amt,
      amountLabel: `+$${amt}`,
      badge: "Claim",
      tone: "blue",
    };
  }

  if (name === "CampaignClosed") {
    return {
      ...base,
      type: "lifecycle",
      title: "Campaign closed",
      badge: "Close",
      tone: "slate",
    };
  }

  if (name === "CampaignPaused") {
    return {
      ...base,
      type: "lifecycle",
      title: "Campaign paused",
      badge: "Pause",
      tone: "slate",
    };
  }

  if (name === "CampaignUnpaused") {
    return {
      ...base,
      type: "lifecycle",
      title: "Campaign resumed",
      badge: "Resume",
      tone: "slate",
    };
  }

  return null;
};

const deduplicateActivityEvents = (events) => {
  const grouped = new Map();

  for (const event of events) {
    const key = event.transactionHash;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(event);
  }

  const result = [];

  for (const txEvents of grouped.values()) {
    const hasCombined = txEvents.some(
      (e) => e.fragment?.name === "BeneficiariesRegisteredAndLocked"
    );

    for (const event of txEvents) {
      const name = event.fragment?.name;

      if (
        hasCombined &&
        (name === "BeneficiariesRegistered" || name === "BeneficiariesLocked")
      ) {
        continue;
      }

      result.push(event);
    }
  }

  return result;
};

const getActivitiesForCampaign = async (campaign) => {
  const provider = activityProvider();

  if (!campaign?.campaignAddress || !ethers.isAddress(campaign.campaignAddress)) {
    return [];
  }

  const contract = new ethers.Contract(
    campaign.campaignAddress,
     HOPE_CAMPAIGN_READ_ABI,
    provider
  );

  const cache = new Map();

  const safeQuery = async (label, filterBuilder) => {
    try {
      return await contract.queryFilter(filterBuilder(), 0, "latest");
    } catch (err) {
      console.warn(`Activity query skipped: ${label}`, err?.message || err);
      return [];
    }
  };

  const groups = await Promise.all([
    safeQuery("DonationReceived", () => contract.filters.DonationReceived()),
    safeQuery("BeneficiariesRegistered", () => contract.filters.BeneficiariesRegistered()),
    safeQuery("BeneficiariesRegisteredAndLocked", () => contract.filters.BeneficiariesRegisteredAndLocked()),
    safeQuery("BeneficiariesLocked", () => contract.filters.BeneficiariesLocked()),
    safeQuery("FundsClaimed", () => contract.filters.FundsClaimed()),
    safeQuery("CampaignClosed", () => contract.filters.CampaignClosed()),
    safeQuery("CampaignPaused", () => contract.filters.CampaignPaused()),
    safeQuery("CampaignUnpaused", () => contract.filters.CampaignUnpaused()),
  ]);

  let events = groups.flat();
  events = deduplicateActivityEvents(events);

  if (FACTORY_ADDRESS && ethers.isAddress(FACTORY_ADDRESS)) {
    try {
      const factory = getFactoryContract();

      const created = await factory.queryFilter(
        factory.filters.CampaignCreated(campaign.campaignAddress),
        0,
        "latest"
      );

      events = [...events, ...created];
    } catch (err) {
      console.warn("CampaignCreated query skipped:", err?.message || err);
    }
  }
  

  const normalized = await Promise.all(
    events.map((event) =>
      normalizeEvent({
        provider,
        event,
        campaign,
        cache,
      })
    )
  );

  return normalized
    .filter(Boolean)
    .sort((a, b) => {
      if (b.blockNumber !== a.blockNumber) return b.blockNumber - a.blockNumber;
      return String(b.id).localeCompare(String(a.id));
    });
};

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
    // Campaign events
  "function getCampaignDetails() view returns (address _partner, string _title, string _location, uint256 _goalAmount, uint256 _raisedAmount, uint256 _claimedAmount, uint256 _remainingAmount, uint256 _deadline, uint256 _beneficiaryCount, uint256 _claimedCount, bool _isActive, bool _isPaused, bool _beneficiariesLocked, bool _donationsOpen, string _documentCID)",
  "event BeneficiariesRegisteredAndLocked(uint256 count, string ipfsCID, uint256 timestamp)",
  "event DonationReceived(address indexed donor, uint256 amount, uint256 totalRaised)",
  "event BeneficiariesRegistered(uint256 count, string ipfsCID, uint256 timestamp)",
  "event BeneficiariesLocked(uint256 count, uint256 timestamp)",
  "event FundsClaimed(bytes32 indexed claimHash, uint256 amount, uint256 claimedCount, uint256 remainingAmount, uint256 timestamp)",
  "event CampaignClosed(uint256 totalRaised, uint256 totalClaimed, uint256 timestamp)",
  "event CampaignPaused()",
  "event CampaignUnpaused()",
    // Factory event
   "event CampaignCreated(address indexed campaignAddress, address indexed partner, string title, uint256 goalAmount, uint256 deadline)"
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

const getCampaignBeneficiaryCollection = (campaignId) =>
  db.collection("campaigns").doc(campaignId).collection("beneficiaries");

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

    const role = userDoc.exists ? userDoc.data()?.role : null;

    // Accept numeric or string roles (e.g., 1 or "1").
    if (!userDoc.exists || String(role) !== "1") {
      return res.status(403).json({ error: "Forbidden. Admin access only." });
    }

    req.adminUid = decoded.uid;
    next();
  } catch {
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

    // Accept numeric or string roles (e.g., 2 or "2").
    if (String(userData?.role) !== "2") {
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
const normalizeGender = (value = "") => String(value).trim().toLowerCase();
const normalizeIdType = (value = "") => String(value).trim().toLowerCase();
const normalizeIdNumber = (value = "") =>
  String(value).trim().toUpperCase().replace(/\s+/g, "");

const parseAge = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 120) {
    throw new ClientInputError("Age must be a whole number between 0 and 120.");
  }
  return n;
};

const getAgeBand = (age) => {
  if (age < 18) return "0-17";
  if (age < 26) return "18-25";
  if (age < 41) return "26-40";
  if (age < 61) return "41-60";
  return "60+";
};

const generateClaimCode = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

const generateClaimHash = ({ campaignAddress, idType, idNumber }) => {
  const raw = [
    String(campaignAddress).toLowerCase(),
    normalizeIdType(idType),
    normalizeIdNumber(idNumber),
    BENEFICIARY_SECRET,
  ].join("|");

  return ethers.keccak256(ethers.toUtf8Bytes(raw));
};

const validateDraftBeneficiaryInput = (item) => {
  const fullName = String(item?.fullName || "").trim();
  const age = parseAge(item?.age);
  const gender = normalizeGender(item?.gender || "");
  const idType = normalizeIdType(item?.idType || "");
  const idNumber = normalizeIdNumber(item?.idNumber || "");
  const selfie = String(item?.photoUrls?.selfie || "").trim();
  const idFront = String(item?.photoUrls?.idFront || "").trim();
  const idBack = String(item?.photoUrls?.idBack || "").trim();

  if (!fullName) {
    throw new ClientInputError("Full name is required.");
  }

  if (!["male", "female", "other"].includes(gender)) {
    throw new ClientInputError("Gender must be male, female, or other.");
  }

  if (!idType) {
    throw new ClientInputError("ID type is required.");
  }

  if (!idNumber) {
    throw new ClientInputError("ID number is required.");
  }

  if (!selfie) {
  throw new ClientInputError("Beneficiary selfie URL is required.");
  }

  if (!idFront) {
  throw new ClientInputError("ID front image URL is required.");
  }

  if (!idBack) {
  throw new ClientInputError("ID back image URL is required.");
  }

  return {
    fullName,
    age,
    gender,
    idType,
    idNumber,
    normalizedIdType: idType,
    normalizedIdNumber: idNumber,
    normalizedIdentityKey: `${idType}:${idNumber}`,
    photoUrls: {
      selfie,
      idFront,
      idBack,
    },
  };
};

const buildPublicBeneficiaryRecord = ({ campaignAddress, claimHash, age, gender, idType }) => ({
  campaignAddress,
  claimHash,
  ageBand: getAgeBand(age),
  gender,
  idType,
  photoProof:  {
    selfie: true,
    idFront: true,
    idBack: true,
  },
  registeredAt: new Date().toISOString(),
});

const buildManifestVersionRecord = ({
  campaignAddress,
  version,
  previousManifestCID,
  claimHash,
  beneficiaryCID,
  totalCount,
}) => ({
  campaignAddress,
  version,
  previousManifestCID: previousManifestCID || null,
  generatedAt: new Date().toISOString(),
  newEntry: {
    claimHash,
    beneficiaryCID,
  },
  totalCount,
});

const findExistingBeneficiaryByIdentity = async (campaignId, normalizedIdentityKey) => {
  const snapshot = await getCampaignBeneficiaryCollection(campaignId)
    .where("normalizedIdentityKey", "==", normalizedIdentityKey)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  return {
    id: snapshot.docs[0].id,
    ref: snapshot.docs[0].ref,
    data: snapshot.docs[0].data(),
  };
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

      if (parsed?.name === "BeneficiariesRegistered" ||  parsed?.name === "BeneficiariesRegisteredAndLocked") {
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

const verifyCampaignClosedState = async (campaignAddress) => {
  const contract = getCampaignReadContract(campaignAddress);
  const details = await contract.getCampaignDetails();

  if (details._isActive) {
    throw new Error("Campaign is still active on-chain after close transaction.");
  }

  return details;
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

    const actionCodeSettings = {
      url: process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/admin/login`
        : "http://localhost:5173/admin/login",
      handleCodeInApp: false,
    };

    const resetLink = await auth.generatePasswordResetLink(
      partner.email,
      actionCodeSettings
    );

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

    await partnerRef.update({
      accountCreated: true,
      accountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
      firebaseUid: uid,
      accountCreationError: admin.firestore.FieldValue.delete(),
      accountCreationErrorAt: admin.firestore.FieldValue.delete(),
    });

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
// Intentionally left open exactly as before.
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

// ─── POST /api/beneficiaries/register-draft ──────────────────────────────────
app.post("/api/beneficiaries/register-draft", verifyPartner, async (req, res) => {
  try {
    const {
      campaignAddress,
      fullName,
      age,
      gender,
      idType,
      idNumber,
      photoUrls,
    } = req.body || {};

    if (!campaignAddress || !ethers.isAddress(campaignAddress)) {
      return buildError(res, 400, "campaign-not-found", "Valid campaignAddress is required.");
    }

    const campaignDoc = await getCampaignDocByAddress(campaignAddress);

    if (!campaignDoc) {
      return buildError(res, 404, "campaign-not-found", "Campaign not found.");
    }

    if (campaignDoc.data.partnerUid !== req.partnerUid) {
      return buildError(res, 403, "campaign-not-owned", "You do not own this campaign.");
    }

    if (campaignDoc.data.beneficiariesLocked === true) {
      return buildError(
        res,
        400,
        "beneficiaries-locked",
        "Beneficiary registration is already closed for this campaign."
      );
    }

    const contract = getCampaignReadContract(campaignAddress);
    const details = await contract.getCampaignDetails();

    if (!details._isActive) {
      return buildError(res, 400, "campaign-not-active", "Campaign is not active on-chain.");
    }

    if (details._beneficiariesLocked) {
      return buildError(
        res,
        400,
        "beneficiaries-locked",
        "Beneficiaries are already locked on-chain."
      );
    }

    const cleaned = validateDraftBeneficiaryInput({
      fullName,
      age,
      gender,
      idType,
      idNumber,
      photoUrls,
    });

    const duplicate = await findExistingBeneficiaryByIdentity(
      campaignDoc.id,
      cleaned.normalizedIdentityKey
    );

    if (duplicate) {
      return buildError(
        res,
        409,
        "duplicate-beneficiary",
        "A beneficiary with the same ID type and ID number already exists for this campaign."
      );
    }

    const claimHash = generateClaimHash({
      campaignAddress,
      idType: cleaned.normalizedIdType,
      idNumber: cleaned.normalizedIdNumber,
    });

    const claimCode = generateClaimCode();
    const qrPayload = `HOPE|${campaignAddress}|${claimHash}|${claimCode}`;

    const publicBeneficiaryRecord = buildPublicBeneficiaryRecord({
      campaignAddress,
      claimHash,
      age: cleaned.age,
      gender: cleaned.gender,
      idType: cleaned.idType,
    });

    const beneficiaryCID = await uploadJsonToIPFS(
      publicBeneficiaryRecord,
      `beneficiary-${claimHash}.json`
    );

    const nextVersion = Number(campaignDoc.data.beneficiaryManifestVersion || 0) + 1;
    const nextCount = Number(campaignDoc.data.beneficiaryCount || 0) + 1;

    const manifestRecord = buildManifestVersionRecord({
      campaignAddress,
      version: nextVersion,
      previousManifestCID: campaignDoc.data.latestBeneficiaryManifestCID || null,
      claimHash,
      beneficiaryCID,
      totalCount: nextCount,
    });

    const manifestCID = await uploadJsonToIPFS(
      manifestRecord,
      `beneficiary-manifest-${campaignAddress}-${nextVersion}.json`
    );

    const beneficiaryRef = getCampaignBeneficiaryCollection(campaignDoc.id).doc(claimHash);

    const batch = db.batch();

    batch.set(beneficiaryRef, {
      campaignAddress,
      campaignId: campaignDoc.id,
      partnerUid: req.partnerUid,

      fullName: cleaned.fullName,
      age: cleaned.age,
      gender: cleaned.gender,
      idType: cleaned.idType,
      idNumber: cleaned.idNumber,
      normalizedIdType: cleaned.normalizedIdType,
      normalizedIdNumber: cleaned.normalizedIdNumber,
      normalizedIdentityKey: cleaned.normalizedIdentityKey,
      photoUrls: cleaned.photoUrls,

      claimHash,
      claimCode,
      qrPayload,

      beneficiaryCID,
      manifestCID,

      status: "draft",
      onChainRegistered: false,

      batchId: null,
      finalManifestCID: null,
      registrationTxHash: null,

      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    batch.update(campaignDoc.ref, {
      beneficiaryCount: nextCount,
      latestBeneficiaryManifestCID: manifestCID,
      beneficiaryManifestVersion: nextVersion,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return res.status(200).json({
      success: true,
      beneficiaryId: claimHash,
      claimHash,
      claimCode,
      qrPayload,
      beneficiaryCID,
      manifestCID,
    });
  } catch (error) {
    console.error("Draft beneficiary registration failed:", error);

    if (error instanceof ClientInputError) {
      return buildError(res, 400, error.code || "invalid-beneficiary-row", error.message);
    }

    return buildError(
      res,
      500,
      "register-draft-failed",
      error?.message || "Beneficiary draft registration failed."
    );
  }
});

// ─── GET /api/beneficiaries/:campaignAddress ─────────────────────────────────
app.get("/api/beneficiaries/:campaignAddress", verifyPartner, async (req, res) => {
  try {
    const { campaignAddress } = req.params;

    if (!campaignAddress || !ethers.isAddress(campaignAddress)) {
      return buildError(res, 400, "campaign-not-found", "Valid campaignAddress is required.");
    }

    const campaignDoc = await getCampaignDocByAddress(campaignAddress);

    if (!campaignDoc) {
      return buildError(res, 404, "campaign-not-found", "Campaign not found.");
    }

    if (campaignDoc.data.partnerUid !== req.partnerUid) {
      return buildError(res, 403, "campaign-not-owned", "You do not own this campaign.");
    }

    const snapshot = await getCampaignBeneficiaryCollection(campaignDoc.id).get();

    const beneficiaries = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    return res.status(200).json({
      success: true,
      campaignId: campaignDoc.id,
      beneficiaries,
    });
  } catch (error) {
    console.error("Failed to fetch beneficiaries:", error);
    return buildError(
      res,
      500,
      "fetch-beneficiaries-failed",
      error?.message || "Failed to fetch beneficiaries."
    );
  }
});

// ─── POST /api/claims/verify-qr ──────────────────────────────────────────────
// Partner scans QR or enters claim code manually.
// Accepts either claimHash (0x... from QR scan) or claimCode (8-char from physical card).
app.post("/api/claims/verify-qr", verifyPartner, async (req, res) => {
  try {
    const { campaignAddress, claimHash: rawClaimHash, claimCode } = req.body || {};

    if (!campaignAddress || !ethers.isAddress(campaignAddress)) {
      return buildError(res, 400, "invalid-campaign", "Valid campaignAddress is required.");
    }

    // Must provide either a claimHash or a claimCode — not neither
    if (!rawClaimHash && !claimCode) {
      return buildError(res, 400, "invalid-input", "Either claimHash or claimCode is required.");
    }

    const campaignDoc = await getCampaignDocByAddress(campaignAddress);

    if (!campaignDoc) {
      return buildError(res, 404, "campaign-not-found", "Campaign not found.");
    }

    if (campaignDoc.data.partnerUid !== req.partnerUid) {
      return buildError(res, 403, "campaign-not-owned", "You do not own this campaign.");
    }

    // Look up beneficiary — by claimHash (QR scan) or claimCode (manual entry)
    let claimHash = rawClaimHash || null;
    let beneficiarySnapshot;

    if (claimHash) {
      beneficiarySnapshot = await getCampaignBeneficiaryCollection(campaignDoc.id)
        .where("claimHash", "==", claimHash)
        .limit(1)
        .get();
    } else {
      beneficiarySnapshot = await getCampaignBeneficiaryCollection(campaignDoc.id)
        .where("claimCode", "==", claimCode.toUpperCase())
        .limit(1)
        .get();
    }

    if (beneficiarySnapshot.empty) {
      return buildError(
        res,
        404,
        "beneficiary-not-found",
        claimHash
          ? "No beneficiary found with this claim hash."
          : "No beneficiary found with this claim code."
      );
    }

    const beneficiary = beneficiarySnapshot.docs[0].data();

    // If we looked up by claimCode, resolve the hash now for on-chain verification
    if (!claimHash) {
      claimHash = beneficiary.claimHash;
    }

    // Verify campaign is locked on-chain
    const contract = getCampaignReadContract(campaignAddress);
    const details = await contract.getCampaignDetails();

    if (!details._beneficiariesLocked) {
      return buildError(
        res,
        400,
        "beneficiaries-not-locked",
        "Beneficiaries are not locked on-chain yet."
      );
    }

    // Verify claim is valid on-chain
    const HOPE_CAMPAIGN_CLAIM_ABI = [
      "function verifyClaimHash(bytes32 _claimHash) view returns (bool isValid, bool hasBeenClaimed)",
    ];

    const claimContract = new ethers.Contract(
      campaignAddress,
      HOPE_CAMPAIGN_CLAIM_ABI,
      new ethers.JsonRpcProvider(HARDHAT_RPC_URL)
    );

    const { isValid, hasBeenClaimed } = await claimContract.verifyClaimHash(claimHash);

    if (!isValid) {
      return buildError(res, 400, "invalid-claim-hash", "Claim hash is not registered on-chain.");
    }

    if (hasBeenClaimed) {
      return buildError(res, 400, "already-claimed", "This beneficiary has already claimed.");
    }

    // Return beneficiary details for partner verification
    return res.status(200).json({
      success: true,
      beneficiary: {
        claimHash,
        claimCode: beneficiary.claimCode,
        fullName: beneficiary.fullName,
        age: beneficiary.age,
        gender: beneficiary.gender,
        idType: beneficiary.idType,
        idNumber: beneficiary.idNumber,
        photoUrls: beneficiary.photoUrls,
      },
      campaign: {
        title: campaignDoc.data.title,
        partner: details._partner,
        raisedAmount: Number(details._raisedAmount),
        beneficiaryCount: Number(details._beneficiaryCount),
        claimedCount: Number(details._claimedCount),
      },
    });
  } catch (error) {
    console.error("Verify QR failed:", error);
    return buildError(res, 500, "verify-qr-failed", error?.message || "QR verification failed.");
  }
});

// ─── POST /api/claims/process ────────────────────────────────────────────────
// Partner approves and submits claim to blockchain
app.post("/api/claims/process", verifyPartner, async (req, res) => {
  try {
    const { campaignAddress, claimHash, txHash } = req.body || {};

    if (!campaignAddress || !ethers.isAddress(campaignAddress)) {
      return buildError(res, 400, "invalid-campaign", "Valid campaignAddress is required.");
    }

    if (!claimHash || !claimHash.startsWith("0x")) {
      return buildError(res, 400, "invalid-claim-hash", "Valid claimHash is required.");
    }

    if (!txHash || !txHash.startsWith("0x")) {
      return buildError(res, 400, "invalid-tx-hash", "Valid blockchain transaction hash is required.");
    }

    const campaignDoc = await getCampaignDocByAddress(campaignAddress);

    if (!campaignDoc) {
      return buildError(res, 404, "campaign-not-found", "Campaign not found.");
    }

    if (campaignDoc.data.partnerUid !== req.partnerUid) {
      return buildError(res, 403, "campaign-not-owned", "You do not own this campaign.");
    }

    const receipt = await verifyTransactionReceipt(txHash, campaignAddress);

    console.log("Claim tx:", txHash);
    console.log("API claimHash:", claimHash);
    console.log("Receipt logs:", receipt.logs.map((log) => ({
      address: log.address,
      topics: log.topics,
      data: log.data,
    })));

    const iface = new ethers.Interface(HOPE_CAMPAIGN_READ_ABI);

    let claimEventFound = false;
    let claimedAmountFromEvent = null;

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== campaignAddress.toLowerCase()) continue;

      try {
        const parsed = iface.parseLog(log);

        if (parsed?.name === "FundsClaimed") {
          const eventClaimHash = String(parsed.args[0]).toLowerCase();
          const eventAmount = parsed.args[1];

          if (eventClaimHash === claimHash.toLowerCase()) {
            claimEventFound = true;
            claimedAmountFromEvent = eventAmount;
            break;
          }
        }
      } catch (_) {}
    }

    if (!claimEventFound || claimedAmountFromEvent === null) {
      return buildError(
        res,
        400,
        "invalid-claim-transaction",
        "Invalid claim transaction: FundsClaimed event not found for this claim hash."
      );
    }

    const beneficiarySnapshot = await getCampaignBeneficiaryCollection(campaignDoc.id)
      .where("claimHash", "==", claimHash)
      .limit(1)
      .get();

    if (beneficiarySnapshot.empty) {
      return buildError(res, 404, "beneficiary-not-found", "Beneficiary not found.");
    }

    const beneficiary = beneficiarySnapshot.docs[0];
    const beneficiaryData = beneficiary.data();

    const contract = getCampaignReadContract(campaignAddress);
    const details = await contract.getCampaignDetails();

    const shareAmount = Number(claimedAmountFromEvent);

    const partnerDoc = await db.collection("users").doc(req.partnerUid).get();
    const partnerData = partnerDoc.exists ? partnerDoc.data() : {};

    const organizationName =
      partnerData.organizationName ||
      req.partnerData?.organizationName ||
      "Partner";

    const batch = db.batch();

    batch.set(
      beneficiary.ref,
      {
        status: "claimed",
        claimed: true,
        claimProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
        claimTxHash: txHash,
        claimAmount: shareAmount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();

    const receipt_data = {
      campaignAddress,
      campaignTitle: campaignDoc.data.title,
      partnerName: organizationName,
      organizationName,
      partnerWallet: details._partner,

      beneficiaryName: beneficiaryData.fullName,
      beneficiaryIdType: beneficiaryData.idType,
      beneficiaryIdNumber: beneficiaryData.idNumber || beneficiaryData.normalizedIdNumber || "—",

      amount: shareAmount,
      amountFormatted: (shareAmount / 1e6).toFixed(2),
      releaseDate: new Date().toISOString().split("T")[0],
      claimHash,
      claimCode: beneficiaryData.claimCode,
      txHash,
    };

    return res.status(200).json({
      success: true,
      receipt: receipt_data,
    });
  } catch (error) {
    console.error("Process claim failed:", error);
    return buildError(res, 500, "claim-process-failed", error?.message || "Claim processing failed.");
  }
});

// ─── GET /api/claims/campaign/:campaignAddress ───────────────────────────────
// Get campaign stats for claims dashboard
app.get("/api/claims/campaign/:campaignAddress", verifyPartner, async (req, res) => {
  try {
    const { campaignAddress } = req.params;
 
    if (!ethers.isAddress(campaignAddress)) {
      return buildError(res, 400, "invalid-campaign", "Valid campaignAddress is required.");
    }
 
    const campaignDoc = await getCampaignDocByAddress(campaignAddress);
 
    if (!campaignDoc) {
      return buildError(res, 404, "campaign-not-found", "Campaign not found.");
    }
 
    if (campaignDoc.data.partnerUid !== req.partnerUid) {
      return buildError(res, 403, "campaign-not-owned", "You do not own this campaign.");
    }
 
    // Get on-chain details
    const contract = getCampaignReadContract(campaignAddress);
    const details = await contract.getCampaignDetails();
 
    // Get all beneficiaries
    const beneficiarySnapshot = await getCampaignBeneficiaryCollection(campaignDoc.id)
      .where("status", "==", "registered")
      .get();
 
    const allBeneficiaries = beneficiarySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
 
    const claimedBeneficiaries = allBeneficiaries.filter((b) => b.status === "claimed");
    const pendingBeneficiaries = allBeneficiaries.filter((b) => b.status === "registered");
 
    const raisedAmount = Number(details._raisedAmount);
    const beneficiaryCount = Number(details._beneficiaryCount);
    const sharePerBeneficiary = beneficiaryCount > 0 ? raisedAmount / beneficiaryCount : 0;
 
    return res.status(200).json({
      success: true,
      campaign: {
        address: campaignAddress,
        title: campaignDoc.data.title,
        location: campaignDoc.data.location,
        isActive: details._isActive,
        beneficiariesLocked: details._beneficiariesLocked,
        raisedAmount,
        raisedAmountFormatted: (raisedAmount / 1e6).toFixed(2),
        goalAmount: Number(details._goalAmount),
        beneficiaryCount,
        claimedCount: claimedBeneficiaries.length,
        pendingCount: pendingBeneficiaries.length,
        sharePerBeneficiary,
        sharePerBeneficiaryFormatted: (sharePerBeneficiary / 1e6).toFixed(2),
      },
    });
  } catch (error) {
    console.error("Get campaign stats failed:", error);
    return buildError(
      res,
      500,
      "campaign-stats-failed",
      error?.message || "Failed to fetch campaign stats."
    );
  }
});

// ─── Existing batch routes kept for compatibility ────────────────────────────
app.post("/api/beneficiaries/prepare-final-batch", verifyPartner, async (req, res) => {
  try {
    const { campaignAddress } = req.body || {};

    if (!campaignAddress || !ethers.isAddress(campaignAddress)) {
      return buildError(res, 400, "campaign-not-found", "Valid campaignAddress is required.");
    }

    const campaignDoc = await getCampaignDocByAddress(campaignAddress);

    if (!campaignDoc) {
      return buildError(res, 404, "campaign-not-found", "Campaign not found.");
    }

    if (campaignDoc.data.partnerUid !== req.partnerUid) {
      return buildError(res, 403, "campaign-not-owned", "You do not own this campaign.");
    }

    if (campaignDoc.data.beneficiariesLocked === true) {
      return buildError(
        res,
        400,
        "beneficiaries-locked",
        "Beneficiaries are already finalized for this campaign."
      );
    }

    const contract = getCampaignReadContract(campaignAddress);
    const details = await contract.getCampaignDetails();

    if (!details._isActive) {
      return buildError(res, 400, "campaign-not-active", "Campaign is not active on-chain.");
    }

    if (details._beneficiariesLocked) {
      return buildError(
        res,
        400,
        "beneficiaries-locked",
        "Beneficiaries are already locked on-chain."
      );
    }

    const snapshot = await getCampaignBeneficiaryCollection(campaignDoc.id)
      .where("onChainRegistered", "==", false)
      .get();

    const draftBeneficiaries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (draftBeneficiaries.length === 0) {
      return buildError(
        res,
        400,
        "no-draft-beneficiaries",
        "No draft beneficiaries available to finalize."
      );
    }

    const batchId = crypto.randomBytes(16).toString("hex");
    const claimHashes = draftBeneficiaries.map((b) => b.claimHash);

    const finalManifest = {
      campaignAddress,
      batchId,
      generatedAt: new Date().toISOString(),
      count: draftBeneficiaries.length,
      beneficiaries: draftBeneficiaries.map((b) => ({
        claimHash: b.claimHash,
        beneficiaryCID: b.beneficiaryCID,
        ageBand: getAgeBand(b.age),
        gender: b.gender,
        idType: b.idType,
      })),
    };

    const finalManifestCID = await uploadJsonToIPFS(
      finalManifest,
      `beneficiary-final-batch-${campaignAddress}-${batchId}.json`
    );

    await db.collection("beneficiaryFinalizationSessions").doc(batchId).set({
      batchId,
      campaignAddress,
      campaignId: campaignDoc.id,
      partnerUid: req.partnerUid,
      claimHashes,
      beneficiaryIds: draftBeneficiaries.map((b) => b.id),
      count: draftBeneficiaries.length,
      finalManifestCID,
      status: "prepared",
      txHash: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      committedAt: null,
      error: null,
    });

    return res.status(200).json({
      success: true,
      batchId,
      claimHashes,
      finalManifestCID,
      count: draftBeneficiaries.length,
    });
  } catch (error) {
    console.error("Prepare final batch failed:", error);
    return buildError(
      res,
      500,
      "prepare-final-batch-failed",
      error?.message || "Failed to prepare final beneficiary batch."
    );
  }
});

app.post("/api/beneficiaries/commit-final-batch", verifyPartner, async (req, res) => {
  try {
    const { campaignAddress, batchId, txHash } = req.body || {};

    if (!campaignAddress || !ethers.isAddress(campaignAddress)) {
      return buildError(res, 400, "campaign-not-found", "Valid campaignAddress is required.");
    }

    if (!batchId || !txHash) {
      return buildError(
        res,
        400,
        "final-batch-commit-failed",
        "batchId and txHash are required."
      );
    }

    const campaignDoc = await getCampaignDocByAddress(campaignAddress);

    if (!campaignDoc) {
      return buildError(res, 404, "campaign-not-found", "Campaign not found.");
    }

    if (campaignDoc.data.partnerUid !== req.partnerUid) {
      return buildError(res, 403, "campaign-not-owned", "You do not own this campaign.");
    }

    const sessionRef = db.collection("beneficiaryFinalizationSessions").doc(batchId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      return buildError(res, 404, "final-batch-commit-failed", "Finalization session not found.");
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
        "Finalization session does not belong to this campaign/user."
      );
    }

    if (session.txHash && session.txHash !== txHash) {
      return buildError(
        res,
        409,
        "final-batch-commit-failed",
        "This session is already associated with a different transaction."
      );
    }

    if (session.status === "committed") {
      return res.status(200).json({
        success: true,
        txHash: session.txHash,
        finalManifestCID: session.finalManifestCID,
        count: session.count,
      });
    }

    await verifyBeneficiaryRegistrationReceipt(
      txHash,
      campaignAddress,
      session.count,
      session.finalManifestCID
    );

    const batch = db.batch();

    for (const beneficiaryId of session.beneficiaryIds) {
      const ref = getCampaignBeneficiaryCollection(campaignDoc.id).doc(beneficiaryId);
      batch.set(
        ref,
        {
          status: "registered",
          onChainRegistered: true,
          batchId,
          finalManifestCID: session.finalManifestCID,
          registrationTxHash: txHash,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    batch.update(campaignDoc.ref, {
      finalBatchManifestCID: session.finalManifestCID,
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
      txHash,
      finalManifestCID: session.finalManifestCID,
      count: session.count,
    });
  } catch (error) {
    console.error("Commit final batch failed:", error);

    const { batchId, txHash } = req.body || {};
    if (batchId) {
      await db.collection("beneficiaryFinalizationSessions").doc(batchId).set(
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
      error?.message || "Blockchain may have succeeded but final batch Firestore commit failed."
    );
  }
});

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
      donationsOpen: true,
      status: "active",
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

// ─── NEW: Close flow prepare endpoint ────────────────────────────────────────
app.post("/api/campaigns/prepare-close", verifyPartner, async (req, res) => {
  try {
    const { campaignAddress } = req.body || {};

    if (!campaignAddress || !ethers.isAddress(campaignAddress)) {
      return buildError(res, 400, "campaign-not-found", "Valid campaignAddress is required.");
    }

    const campaignDoc = await getCampaignDocByAddress(campaignAddress);

    if (!campaignDoc) {
      return buildError(res, 404, "campaign-not-found", "Campaign not found.");
    }

    if (campaignDoc.data.partnerUid !== req.partnerUid) {
      return buildError(res, 403, "campaign-not-owned", "You do not own this campaign.");
    }

    if (campaignDoc.data.status === "closed") {
      return buildError(res, 400, "campaign-already-closed", "Campaign is already closed.");
    }

    const contract = getCampaignReadContract(campaignAddress);
    const details = await contract.getCampaignDetails();

    if (!details._isActive) {
      return buildError(res, 400, "campaign-not-active", "Campaign is already inactive on-chain.");
    }

    const snapshot = await getCampaignBeneficiaryCollection(campaignDoc.id)
      .where("onChainRegistered", "==", false)
      .get();

    const draftBeneficiaries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const closeSessionId = crypto.randomBytes(16).toString("hex");

    let claimHashes = [];
    let finalManifestCID = null;
    let count = 0;

    if (draftBeneficiaries.length > 0) {
      claimHashes = draftBeneficiaries.map((b) => b.claimHash);
      count = draftBeneficiaries.length;

      const finalManifest = {
        campaignAddress,
        closeSessionId,
        generatedAt: new Date().toISOString(),
        count,
        beneficiaries: draftBeneficiaries.map((b) => ({
          claimHash: b.claimHash,
          beneficiaryCID: b.beneficiaryCID,
          ageBand: getAgeBand(b.age),
          gender: b.gender,
          idType: b.idType,
        })),
      };

      finalManifestCID = await uploadJsonToIPFS(
        finalManifest,
        `beneficiary-close-${campaignAddress}-${closeSessionId}.json`
      );
    }

    await db.collection("campaignCloseSessions").doc(closeSessionId).set({
      closeSessionId,
      campaignAddress,
      campaignId: campaignDoc.id,
      partnerUid: req.partnerUid,
      beneficiaryIds: draftBeneficiaries.map((b) => b.id),
      claimHashes,
      finalManifestCID,
      count,
      status: "prepared",
      registerTxHash: null,
      lockTxHash: null,
      closeTxHash: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      committedAt: null,
      error: null,
    });

    return res.status(200).json({
      success: true,
      closeSessionId,
      count,
      claimHashes,
      finalManifestCID,
    });
  } catch (error) {
    console.error("Prepare close failed:", error);
    return buildError(
      res,
      500,
      "prepare-close-failed",
      error?.message || "Failed to prepare campaign close."
    );
  }
});

// ─── NEW: Close flow commit endpoint ─────────────────────────────────────────
app.post("/api/campaigns/commit-close", verifyPartner, async (req, res) => {
  try {
    const {
      campaignAddress,
      closeSessionId,
      registerTxHash,
      lockTxHash,
      closeTxHash,
    } = req.body || {};

    if (!campaignAddress || !ethers.isAddress(campaignAddress)) {
      return buildError(res, 400, "campaign-not-found", "Valid campaignAddress is required.");
    }

    if (!closeSessionId || !lockTxHash || !closeTxHash) {
      return buildError(
        res,
        400,
        "commit-close-failed",
        "closeSessionId, lockTxHash, and closeTxHash are required."
      );
    }

    const campaignDoc = await getCampaignDocByAddress(campaignAddress);

    if (!campaignDoc) {
      return buildError(res, 404, "campaign-not-found", "Campaign not found.");
    }

    if (campaignDoc.data.partnerUid !== req.partnerUid) {
      return buildError(res, 403, "campaign-not-owned", "You do not own this campaign.");
    }

    const sessionRef = db.collection("campaignCloseSessions").doc(closeSessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      return buildError(res, 404, "commit-close-failed", "Close session not found.");
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
        "Close session does not belong to this campaign/user."
      );
    }

    if (session.status === "committed") {
      return res.status(200).json({
        success: true,
        closeTxHash: session.closeTxHash,
        lockTxHash: session.lockTxHash,
        registerTxHash: session.registerTxHash,
        finalManifestCID: session.finalManifestCID,
        count: session.count,
      });
    }

    if (session.count > 0) {
      if (!registerTxHash) {
        return buildError(
          res,
          400,
          "commit-close-failed",
          "registerTxHash is required when draft beneficiaries exist."
        );
      }

      await verifyBeneficiaryRegistrationReceipt(
        registerTxHash,
        campaignAddress,
        session.count,
        session.finalManifestCID
      );
    }

    await verifyTransactionReceipt(lockTxHash, campaignAddress);
    const lockDetails = await getCampaignReadContract(campaignAddress).getCampaignDetails();

    if (!lockDetails._beneficiariesLocked) {
      throw new Error("Beneficiaries are not locked on-chain after lock transaction.");
    }

    await verifyTransactionReceipt(closeTxHash, campaignAddress);
    await verifyCampaignClosedState(campaignAddress);

    const batch = db.batch();

    if (session.count > 0) {
      for (const beneficiaryId of session.beneficiaryIds) {
        const ref = getCampaignBeneficiaryCollection(campaignDoc.id).doc(beneficiaryId);
        batch.set(
          ref,
          {
            status: "registered",
            onChainRegistered: true,
            batchId: closeSessionId,
            finalManifestCID: session.finalManifestCID,
            registrationTxHash: registerTxHash,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    batch.update(campaignDoc.ref, {
      status: "closed",
      beneficiariesLocked: true,
      beneficiariesLockedAt: admin.firestore.FieldValue.serverTimestamp(),
      beneficiaryLockTxHash: lockTxHash,
      closeCampaignTxHash: closeTxHash,
      finalBatchManifestCID: session.finalManifestCID || null,
      beneficiaryRegistrationVersion: admin.firestore.FieldValue.increment(session.count > 0 ? 1 : 0),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    batch.update(sessionRef, {
      status: "committed",
      registerTxHash: registerTxHash || null,
      lockTxHash,
      closeTxHash,
      committedAt: admin.firestore.FieldValue.serverTimestamp(),
      error: null,
    });

    await batch.commit();

    return res.status(200).json({
      success: true,
      registerTxHash: registerTxHash || null,
      lockTxHash,
      closeTxHash,
      finalManifestCID: session.finalManifestCID,
      count: session.count,
    });
  } catch (error) {
    console.error("Commit close failed:", error);

    const { closeSessionId, registerTxHash, lockTxHash, closeTxHash } = req.body || {};
    if (closeSessionId) {
      await db.collection("campaignCloseSessions").doc(closeSessionId).set(
        {
          status: "commit_failed",
          error: error?.message || "Commit close failed",
          registerTxHash: registerTxHash || null,
          lockTxHash: lockTxHash || null,
          closeTxHash: closeTxHash || null,
        },
        { merge: true }
      );
    }

    return buildError(
      res,
      500,
      "reconciliation-required",
      error?.message || "One or more close transactions may have succeeded but Firestore commit failed."
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

// Campaign-specific
app.get("/api/activity/campaign/:campaignAddress", async (req, res) => {
  try {
    const { campaignAddress } = req.params;

    const campaignDoc = await getCampaignDocByAddress(campaignAddress);
    if (!campaignDoc) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const campaign = {
      campaignAddress,
      title: campaignDoc.data.title,
    };

    const activities = await getActivitiesForCampaign(campaign);

    return res.json({ success: true, activities });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch activity" });
  }
});

// Partner-specific
app.get("/api/activity/partner", verifyPartner, async (req, res) => {
  try {
    const snap = await db
      .collection("campaigns")
      .where("partnerUid", "==", req.partnerUid)
      .get();

    const campaigns = snap.docs.map((d) => d.data());

    const groups = await Promise.all(
      campaigns.map((c) => getActivitiesForCampaign(c))
    );

    const merged = groups.flat().sort((a, b) => b.blockNumber - a.blockNumber);

    return res.json({ success: true, activities: merged });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch partner activity" });
  }
});

// Platform-wide
app.get("/api/activity/platform", verifyAdmin, async (req, res) => {
  try {
    const snap = await db.collection("campaigns").get();

    const campaigns = snap.docs.map((d) => d.data());

    const groups = await Promise.all(
      campaigns.map((c) => getActivitiesForCampaign(c))
    );

    const merged = groups.flat().sort((a, b) => b.blockNumber - a.blockNumber);

    return res.json({ success: true, activities: merged });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch platform activity" });
  }
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

// ─── POST /api/campaigns/:campaignAddress/hold ───────────────────────────────
// Admin endpoint to hold/pause a campaign - stops donations and beneficiary registration
app.post("/api/campaigns/:campaignAddress/hold", verifyAdmin, async (req, res) => {
  try {
    const { campaignAddress } = req.params;

    if (!campaignAddress || !ethers.isAddress(campaignAddress)) {
      return buildError(res, 400, "invalid-campaign", "Valid campaignAddress is required.");
    }

    const campaignDoc = await getCampaignDocByAddress(campaignAddress);

    if (!campaignDoc) {
      return buildError(res, 404, "campaign-not-found", "Campaign not found.");
    }

    if (campaignDoc.data.status !== "active") {
      return buildError(
        res,
        400,
        "campaign-not-active",
        "Only active campaigns can be held."
      );
    }

    // Call smart contract to pause campaign
    const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
    // Get admin signer from environment (would need to be set up for production)
    // For now, use a read-only approach and trust Firestore status
    
    // Update Firestore campaign status to on_hold
    await campaignDoc.ref.update({
      status: "on_hold",
      heldAt: admin.firestore.FieldValue.serverTimestamp(),
      heldBy: req.adminUid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: "Campaign has been put on hold. Donations and beneficiary registration are paused.",
      campaign: {
        address: campaignAddress,
        status: "on_hold",
      },
    });
  } catch (error) {
    console.error("Hold campaign failed:", error);
    return buildError(
      res,
      500,
      "hold-campaign-failed",
      error?.message || "Failed to hold campaign."
    );
  }
});

// ─── POST /api/campaigns/:campaignAddress/unhold ─────────────────────────────
// Admin endpoint to resume a held campaign
app.post("/api/campaigns/:campaignAddress/unhold", verifyAdmin, async (req, res) => {
  try {
    const { campaignAddress } = req.params;

    if (!campaignAddress || !ethers.isAddress(campaignAddress)) {
      return buildError(res, 400, "invalid-campaign", "Valid campaignAddress is required.");
    }

    const campaignDoc = await getCampaignDocByAddress(campaignAddress);

    if (!campaignDoc) {
      return buildError(res, 404, "campaign-not-found", "Campaign not found.");
    }

    if (campaignDoc.data.status !== "on_hold") {
      return buildError(
        res,
        400,
        "campaign-not-held",
        "Only held campaigns can be resumed."
      );
    }

    // Update Firestore campaign status back to active
    await campaignDoc.ref.update({
      status: "active",
      uneldAt: admin.firestore.FieldValue.serverTimestamp(),
      uneldBy: req.adminUid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: "Campaign has been resumed. Donations and beneficiary registration are active.",
      campaign: {
        address: campaignAddress,
        status: "active",
      },
    });
  } catch (error) {
    console.error("Unhold campaign failed:", error);
    return buildError(
      res,
      500,
      "unhold-campaign-failed",
      error?.message || "Failed to resume campaign."
    );
  }
});

// ─── GET /api/admin/campaigns/:campaignAddress ─────────────────────────────
// Admin-only: fetch a campaign doc + its beneficiaries using Admin SDK.
// This avoids client-side Firestore rules blocking beneficiary reads.
app.get("/api/admin/campaigns/:campaignAddress", verifyAdmin, async (req, res) => {
  try {
    const { campaignAddress } = req.params;

    if (!campaignAddress || !ethers.isAddress(campaignAddress)) {
      return buildError(res, 400, "invalid-campaign", "Valid campaignAddress is required.");
    }

    const campaignDoc = await getCampaignDocByAddress(campaignAddress);

    if (!campaignDoc) {
      return buildError(res, 404, "campaign-not-found", "Campaign not found.");
    }

    const snapshot = await getCampaignBeneficiaryCollection(campaignDoc.id).get();

    const beneficiaries = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    return res.status(200).json({
      success: true,
      campaign: {
        id: campaignDoc.id,
        campaignAddress,
        ...campaignDoc.data,
      },
      beneficiaries,
    });
  } catch (error) {
    console.error("Admin fetch campaign detail failed:", error);
    return buildError(
      res,
      500,
      "admin-fetch-campaign-failed",
      error?.message || "Failed to fetch campaign detail."
    );
  }
});

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`HOPE backend server running on port ${PORT}`);
});