
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC59GKSsUGZgi2Y_2D4YE32BZGrhjzlLqQ",
  authDomain: "degreew-26763.firebaseapp.com",
  projectId: "degreew-26763",
  storageBucket: "degreew-26763.firebasestorage.app",
  messagingSenderId: "276158770563",
  appId: "1:276158770563:web:a4c933ce90e607707b5ab6",
  measurementId: "G-KWH6HXT1FM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export default app;
