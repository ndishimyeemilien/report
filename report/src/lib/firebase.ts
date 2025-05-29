import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA55AckT_a5h5Z6gUxVd1cnEZOrdAx5Bkk", // Updated
  authDomain: "report-6b40c.firebaseapp.com", // Updated
  projectId: "report-6b40c", // Consistent
  storageBucket: "report-6b40c.appspot.com", // Updated (matches user's specific format)
  messagingSenderId: "1032977742897", // Updated
  appId: "1:1032977742897:web:a207b4721abbee8a976910", // Updated
  // measurementId: "G-JVCPWYJ10C" // This was in my original, user's doesn't have it. Keeping it commented for now.
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
