import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB0aYC8XCpRCEMBc1oygbkZ0uQqZyYitow",
  authDomain: "hope-platform-e045d.firebaseapp.com",
  projectId: "hope-platform-e045d",
  storageBucket: "hope-platform-e045d.firebasestorage.app",
  messagingSenderId: "189460313327",
  appId: "1:189460313327:web:e440b3d098d882171b171a",
  measurementId: "G-QS3NGWZ3DH"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };