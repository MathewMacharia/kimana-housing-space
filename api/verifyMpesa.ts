import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, arrayUnion } from 'firebase/firestore';

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

// Daraja Credentials
const consumerKey = process.env.DARAJA_CONSUMER_KEY;
const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
const passkey = process.env.DARAJA_PASSKEY;
const shortcode = process.env.DARAJA_SHORTCODE || '174379';
const darajaEnv = process.env.DARAJA_ENVIRONMENT === 'production' ? 'api' : 'sandbox';

async function getAccessToken() {
    const authString = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const response = await fetch(`https://${darajaEnv}.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`, {
        headers: { 'Authorization': `Basic ${authString}` }
    });
    
    if (!response.ok) throw new Error('Failed to get M-PESA access token');
    const data = await response.json();
    return data.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { checkoutRequestId, listingId, userId } = req.body;

        if (!checkoutRequestId || !listingId || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Authenticate as Webhook to bypass IAM Org Policies
        await signInWithEmailAndPassword(auth, "webhook@masqani.com", "MasqaniWebhook2026!");

        // 2. Generate Daraja Password
        const token = await getAccessToken();
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

        // 3. Query Daraja STK Push Status
        const queryResponse = await fetch(`https://${darajaEnv}.safaricom.co.ke/mpesa/stkpushquery/v1/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                BusinessShortCode: shortcode,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestId
            })
        });

        const data = await queryResponse.json();

        // 4. Handle Response
        if (data.ResultCode === "0") {
            // Payment Success! Unlock the listing for the user.
            const tenantRef = doc(db, "tenants", userId);
            await setDoc(tenantRef, {
                unlockedListings: arrayUnion(listingId)
            }, { merge: true });

            return res.status(200).json({ success: true, message: "Payment verified successfully!" });
        } else if (data.errorCode === "500.001.1001" || data.ResultCode) {
            // Transaction is either pending, failed, or cancelled
            return res.status(400).json({ 
                success: false, 
                error: data.ResultDesc || data.errorMessage || "Payment is still pending or failed. Please check your phone." 
            });
        } else {
            return res.status(400).json({ success: false, error: "Unable to verify payment status." });
        }

    } catch (error: any) {
        console.error("verifyMpesa error:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}
