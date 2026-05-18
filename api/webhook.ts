import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';

// Initialize Firebase with the public config
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
    // Daraja sends a POST request
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const callbackData = req.body.Body?.stkCallback;
        if (!callbackData) {
            return res.status(400).send("Invalid Payload");
        }

        const checkoutRequestId = callbackData.CheckoutRequestID;
        const resultCode = callbackData.ResultCode;
        
        console.log(`Received webhook for CheckoutRequestID: ${checkoutRequestId}, ResultCode: ${resultCode}`);

        // 1. Authenticate as the dedicated webhook user to bypass Firestore security rules securely
        await signInWithEmailAndPassword(auth, "webhook@masqani.com", "MasqaniWebhook2026!");

        // 2. Fetch the transaction from Firestore
        const transactionRef = doc(db, "mpesa_transactions", checkoutRequestId);
        const transactionSnap = await getDoc(transactionRef);

        if (!transactionSnap.exists()) {
            console.error("Transaction not found for CheckoutRequestID:", checkoutRequestId);
            return res.status(200).send("OK"); // Acknowledge to Safaricom anyway
        }

        const transactionData = transactionSnap.data();

        if (resultCode === 0) {
            // Success!
            const userId = transactionData?.userId;
            const listingId = transactionData?.listingId;

            // Mark transaction as success
            await updateDoc(transactionRef, {
                status: "success",
                resultDesc: callbackData.ResultDesc,
                completedAt: new Date()
            });

            // Add the listing to the user's unlockedListings array
            if (userId && listingId) {
                const tenantRef = doc(db, "tenants", userId);
                await setDoc(tenantRef, {
                    unlockedListings: arrayUnion(listingId)
                }, { merge: true });
                console.log(`Successfully unlocked listing ${listingId} for user ${userId} via M-PESA`);
            }
        } else {
            // Failed
            await updateDoc(transactionRef, {
                status: "failed",
                resultCode: resultCode,
                resultDesc: callbackData.ResultDesc,
                completedAt: new Date()
            });
            console.log(`M-PESA transaction failed for CheckoutRequestID: ${checkoutRequestId}. Reason: ${callbackData.ResultDesc}`);
        }

        return res.status(200).send("OK");
    } catch (error) {
        console.error("Error processing M-PESA webhook:", error);
        return res.status(500).send("Internal Server Error");
    }
}
