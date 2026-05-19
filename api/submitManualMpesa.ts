import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, arrayUnion, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDyooi4MXpfk27nGTffJ3m-2nRDBBzwd7A",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "kimana-housing.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "kimana-housing",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "kimana-housing.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "933432328981",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:933432328981:web:6201dcff1ad84b8e0f5f1c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { listingId, userId, mpesaCode } = req.body;

        if (!listingId || !userId || !mpesaCode) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const normalizedCode = mpesaCode.trim().toUpperCase();

        // Authenticate as Webhook to bypass IAM Org Policies and read all queries
        await signInWithEmailAndPassword(auth, "webhook@masqani.com", "MasqaniWebhook2026!");

        // 1. Check if this exact M-PESA code has already been used globally
        const queriesRef = collection(db, "mpesa_queries");
        const q = query(queriesRef, where("mpesaCode", "==", normalizedCode));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Code is already used!
            return res.status(400).json({ 
                success: false, 
                error: "This M-PESA code has already been used to unlock a property." 
            });
        }

        // 2. Register the manual code
        await addDoc(queriesRef, {
            userId: userId,
            listingId: listingId,
            mpesaCode: normalizedCode,
            createdAt: new Date(), // using local date instead of serverTimestamp since we are in Vercel Node env
            type: 'manual_verification',
            status: 'pending_verification' // Admin can verify later
        });

        // 3. Instantly unlock the listing for the user
        const tenantRef = doc(db, "tenants", userId);
        await setDoc(tenantRef, {
            unlockedListings: arrayUnion(listingId)
        }, { merge: true });

        return res.status(200).json({ success: true, message: "Manual payment verified successfully!" });

    } catch (error: any) {
        console.error("submitManualMpesa error:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}
