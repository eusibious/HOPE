import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { getFirebaseAuthErrorMessage } from "../utils/firebaseErrors";

// ─── Sign In ────────────────────────────────────────────────────────────────
// Used by both admins and partners. Role-based routing is handled in AuthContext.
export const signInUser = async (email, password) => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const userData = await getUserData(credential.user.uid);

    if (!userData) {
      return {
        success: false,
        error: "User profile not found. Please contact support.",
      };
    }

    return {
      success: true,
      user: credential.user,
      userData,
      role: userData.role,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: getFirebaseAuthErrorMessage(error.code),
    };
  }
};

// ─── Submit Partner Application ─────────────────────────────────────────────
// Stores the application in `partner-requests`. Does NOT create a Firebase
// Auth user — account creation happens only after admin approval via
// the Cloud Function in functions/src/index.ts.
export const submitPartnerApplication = async (partnerData) => {
  try {
    // Strip any UI-only fields that should not be stored
    const { agree, ...applicationData } = partnerData;

    const applicationId = `app-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    await setDoc(doc(db, "partner-requests", applicationId), {
      id: applicationId,
      ...applicationData,
      status: "pending",
      accountCreated: false,
      submittedDate: new Date().toISOString(),
    });

    return { success: true, applicationId };
  } catch (error) {
    console.error("Partner application submission error:", error);
    return { success: false, error: error.message };
  }
};

// ─── Get User Data ───────────────────────────────────────────────────────────
// Fetches the user document from the `users` collection.
// Called by AuthContext on every auth state change.
export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

// ─── Sign Out ────────────────────────────────────────────────────────────────
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─── Auth State Observer ─────────────────────────────────────────────────────
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};