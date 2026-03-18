import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

// YOUR SECURE CONFIG - Loaded from environment variables (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
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