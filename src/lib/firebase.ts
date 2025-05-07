import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA55AckT_a5h5Z6gUxVd1cnEZOrdAx5Bkk",
  authDomain: "report-6b40c.firebaseapp.com",
  projectId: "report-6b40c",
  storageBucket: "report-6b40c.firebasestorage.app",
  messagingSenderId: "1032977742897",
  appId: "1:1032977742897:web:a207b4721abbee8a976910",
  measurementId: "G-JVCPWYJ10C"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
