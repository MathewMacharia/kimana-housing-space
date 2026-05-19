import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { listingId, userId } = req.body;

        if (!listingId || !userId) {
            return res.status(400).json({ error: 'Missing listingId or userId' });
        }

        // Authenticate as the dedicated webhook user to bypass Firestore security rules
        await signInWithEmailAndPassword(auth, "webhook@masqani.com", "MasqaniWebhook2026!");

        // 1. Verify if the user has actually unlocked this listing
        const tenantRef = doc(db, "tenants", userId);
        const tenantSnap = await getDoc(tenantRef);
        
        const isUnlocked = tenantSnap.exists() && tenantSnap.data()?.unlockedListings?.includes(listingId);
        
        // Check if user is the landlord of the listing
        const listingRef = doc(db, "listings", listingId);
        const listingSnap = await getDoc(listingRef);
        const listingData = listingSnap.data();

        if (!listingSnap.exists()) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        if (!isUnlocked && listingData?.landlordId !== userId) {
            return res.status(403).json({ error: 'Unauthorized. You must unlock this listing first.' });
        }

        // 2. Fetch the landlord's contact info
        const landlordId = listingData?.landlordId;
        if (!landlordId) {
            return res.status(404).json({ error: 'Landlord not found for this listing.' });
        }

        const landlordRef = doc(db, "landlords", landlordId);
        const landlordSnap = await getDoc(landlordRef);

        if (!landlordSnap.exists()) {
            return res.status(404).json({ error: 'Landlord profile not found.' });
        }

        const landlordData = landlordSnap.data();

        // 3. Return the contact info securely
        return res.status(200).json({
            name: landlordData?.name,
            phone: landlordData?.phone,
            email: landlordData?.email
        });

    } catch (error) {
        console.error("Error revealing contact:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
