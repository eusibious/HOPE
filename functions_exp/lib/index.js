"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryFailedAccountCreation = exports.onPartnerRequestStatusChange = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER: onPartnerRequestStatusChange
//
// Fires on every update to a `partner-requests` document.
// Executes the full account creation flow only when:
//   - status changes from "pending" → "approved"
//   - accountCreated is not already true (idempotency guard)
//
// Flow:
//   1. Create Firebase Auth user with a throwaway temporary password
//   2. Store partner data in `users` collection with role: 2 (Partner)
//   3. Send Firebase password reset email — partner sets their own password
//   4. Mark the request with accountCreated: true to prevent duplicate runs
// ─────────────────────────────────────────────────────────────────────────────
exports.onPartnerRequestStatusChange = (0, firestore_1.onDocumentUpdated)("partner-requests/{partnerId}", async (event) => {
    var _a, _b;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    const partnerId = event.params.partnerId;
    // Safety check — data should always exist on an update event
    if (!before || !after) {
        v2_1.logger.error("Missing event data.", { partnerId });
        return null;
    }
    // Guard 1: Only act on the pending → approved transition
    if (before.status !== "pending" || after.status !== "approved") {
        return null;
    }
    // Guard 2: Idempotency — do not create a duplicate account
    if (after.accountCreated === true) {
        v2_1.logger.warn("Account already created for this request. Skipping.", { partnerId });
        return null;
    }
    v2_1.logger.info("Partner approval detected. Starting account creation.", {
        partnerId,
        email: after.email,
    });
    try {
        // Step 1: Create Firebase Auth user
        // A throwaway temporary password is required by Firebase's createUser().
        // The partner never sees this — the reset link below replaces it immediately.
        let userRecord;
        try {
            userRecord = await auth.createUser({
                email: after.email,
                password: generateTemporaryPassword(),
                displayName: after.contactName || after.organizationName,
                emailVerified: false,
                disabled: false,
            });
            v2_1.logger.info("Firebase Auth user created.", { uid: userRecord.uid });
        }
        catch (authError) {
            const err = authError;
            if (err.code === "auth/email-already-exists") {
                v2_1.logger.warn("Auth user already exists, reusing existing record.", {
                    email: after.email,
                });
                userRecord = await auth.getUserByEmail(after.email);
            }
            else {
                throw authError;
            }
        }
        const uid = userRecord.uid;
        // Step 2: Store partner in the `users` collection
        // role: 2 = Partner (number, consistent with admin role: 1)
        await db.collection("users").doc(uid).set({
            uid,
            role: 2,
            email: after.email,
            organizationName: after.organizationName || "",
            contactName: after.contactName || "",
            phone: after.phone || "",
            description: after.description || "",
            status: "active",
            partnerRequestId: partnerId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        v2_1.logger.info("Partner document written to users collection.", { uid });
        // Step 3: Send password reset email
        // Firebase sends the partner a secure one-time link to set their own password.
        // No password is ever sent over email.
        const actionCodeSettings = {
            url: process.env.APP_URL || "https://your-hope-platform.web.app/login",
            handleCodeInApp: false,
        };
        await auth.generatePasswordResetLink(after.email, actionCodeSettings);
        v2_1.logger.info("Password reset email sent to partner.", { email: after.email });
        // Step 4: Mark request as fully processed
        await event.data.after.ref.update({
            accountCreated: true,
            accountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
            firebaseUid: uid,
            accountCreationError: admin.firestore.FieldValue.delete(),
            accountCreationErrorAt: admin.firestore.FieldValue.delete(),
        });
        v2_1.logger.info("Account creation complete. Request marked as processed.", {
            partnerId,
            uid,
        });
        return null;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        v2_1.logger.error("Account creation failed.", { partnerId, message });
        await event.data.after.ref.update({
            accountCreationError: message,
            accountCreationErrorAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        throw error;
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// CALLABLE: retryFailedAccountCreation
//
// Allows an admin to manually retry account creation after a failure.
// Requires caller to be authenticated with role: 1 (Admin).
// Toggles status pending → approved to re-fire the onUpdate trigger.
// ─────────────────────────────────────────────────────────────────────────────
exports.retryFailedAccountCreation = (0, https_1.onCall)(async (request) => {
    var _a;
    // Auth check
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "You must be logged in.");
    }
    // Admin role check (role: 1 = Admin)
    const callerDoc = await db.collection("users").doc(request.auth.uid).get();
    if (!callerDoc.exists || ((_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 1) {
        throw new https_1.HttpsError("permission-denied", "Only admins can retry account creation.");
    }
    const { partnerId } = request.data;
    if (!partnerId) {
        throw new https_1.HttpsError("invalid-argument", "partnerId is required.");
    }
    const partnerRef = db.collection("partner-requests").doc(partnerId);
    const partnerDoc = await partnerRef.get();
    if (!partnerDoc.exists) {
        throw new https_1.HttpsError("not-found", "Partner request not found.");
    }
    const partnerData = partnerDoc.data();
    if (partnerData.status !== "approved" || partnerData.accountCreated === true) {
        throw new https_1.HttpsError("failed-precondition", "This request is not in a retryable state.");
    }
    // Toggle status to re-trigger the Firestore onUpdate listener
    await partnerRef.update({
        status: "pending",
        accountCreationError: admin.firestore.FieldValue.delete(),
        accountCreationErrorAt: admin.firestore.FieldValue.delete(),
    });
    await partnerRef.update({ status: "approved" });
    v2_1.logger.info("Retry triggered by admin.", {
        partnerId,
        adminUid: request.auth.uid,
    });
    return { success: true, message: "Account creation retry has been triggered." };
});
// ─────────────────────────────────────────────────────────────────────────────
// HELPER: generateTemporaryPassword
// Partner never sees this — satisfies Firebase createUser() requirement only.
// ─────────────────────────────────────────────────────────────────────────────
function generateTemporaryPassword() {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const required = ["A", "a", "0", "!"];
    const random = Array.from({ length: 20 }, () => charset.charAt(Math.floor(Math.random() * charset.length)));
    return [...required, ...random].sort(() => Math.random() - 0.5).join("");
}
//# sourceMappingURL=index.js.map