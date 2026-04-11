import 'dotenv/config';
import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import nodemailer from "nodemailer";
import axios from "axios";
import FormData from "form-data";
import dns from "dns/promises";


// ─── Firebase Admin Initialization ───────────────────────────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

// ─── Nodemailer Transporter ───────────────────────────────────────────────────
// Uses Gmail SMTP. Set EMAIL_USER and EMAIL_PASSWORD in your .env file.
// For Gmail, EMAIL_PASSWORD must be an App Password, not your regular password.
// Generate one at: https://myaccount.google.com/apppasswords
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ─── Express Setup ────────────────────────────────────────────────────────────
const app = express();

// app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ─── Auth Middleware ──────────────────────────────────────────────────────────
// Verifies the Firebase ID token sent from the frontend.
// Ensures only authenticated admins can call this endpoint.
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

// ─── POST /api/approve-partner ────────────────────────────────────────────────
// Called by AdminContext.approvePartner() after updating Firestore status.
// Body: { partnerId: string }
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

  // Idempotency guard — account already created
  if (partner.accountCreated === true) {
    return res.status(200).json({
      success: true,
      message: "Account already exists.",
      firebaseUid: partner.firebaseUid,
    });
  }

  try {
    // ── Step 1: Create Firebase Auth user ──────────────────────────────────
    // Throwaway password — partner sets their own via the reset email.
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

    // ── Step 2: Store partner in users collection ──────────────────────────
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

    // ── Step 3: Generate password reset link ───────────────────────────────
    // generatePasswordResetLink() returns the link but does NOT send email.
    // We send it ourselves via Nodemailer below.
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

    // ── Step 4: Send welcome email with reset link via Nodemailer ──────────
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

    // ── Step 5: Mark request as processed ──────────────────────────────────
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

app.post("/api/upload-ipfs", async (req, res) => {
  console.log("🔥 HIT IPFS ROUTE")
  try {
    const { fileBase64, fileName } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Convert base64 → buffer
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

// ─── POST /api/validate-email-domain ───────────────────────────────────────
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
    pinata: process.env.PINATA_API_KEY ? "OK" : "Missing"
  });
});

// ─── Helper: Email Validation ───────────────────────────────────────────────
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


// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`HOPE backend server running on port ${PORT}`);
});



