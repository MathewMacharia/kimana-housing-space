import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

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

// APP CHECK (reCAPTCHA Enterprise)
if (typeof window !== 'undefined') {
  // Use the site key from .env
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  if (siteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
    console.log("🛡️ App Check initialized with reCAPTCHA Enterprise");
  } else {
    console.warn("⚠️ App Check skip: VITE_RECAPTCHA_SITE_KEY missing in .env");
  }
}

// GET SERVICES
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, "us-central1");
const googleProvider = new GoogleAuthProvider();

// Analytics is optional and can fail in some environments
isSupported().then(supported => {
  if (supported) getAnalytics(app);
});

console.log("✅ Firebase Services (including Cloud Functions) Registered");

export { app, auth, db, storage, functions, googleProvider, httpsCallable };