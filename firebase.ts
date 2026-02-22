import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// YOUR SECURE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDyooi4MXpfk27nGTffJ3m-2nRDBBzwd7A",
  authDomain: "kimana-housing.firebaseapp.com",
  projectId: "kimana-housing",
  storageBucket: "kimana-housing.firebasestorage.app",
  messagingSenderId: "933432328981",
  appId: "1:933432328981:web:6201dcff1ad84b8e0f5f1c",
  measurementId: "G-LB5LHRK21J"
};

// INITIALIZE WITH A SINGLETON PATTERN
let app;
try {
  // This prevents the "already initialized" error if the preview refreshes fast
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.log("App initialization skipped or handled:", e);
  app = getApp();
}

// GET SERVICES
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Analytics is optional and can fail in some environments
isSupported().then(supported => {
  if (supported) getAnalytics(app);
});

console.log("✅ Firebase Auth, Firestore & Storage Registered via GSTATIC 10.8.0");

export { app, auth, db, storage, googleProvider };