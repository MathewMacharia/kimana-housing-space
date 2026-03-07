import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

export const revealContact = onCall({
    minInstances: 1, // Keep 1 instance warm at all times to eliminate cold starts
    concurrency: 80, // Allow 1 instance to handle up to 80 concurrent requests
    memory: "512MiB", // Valid v2 memory format
    timeoutSeconds: 30,
    region: "us-central1" // Primary region (multi-region handled in firebase.json for deployment)
}, async (request) => {
    // 1. Authentication Check
    if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "User must be logged in to reveal contact."
        );
    }

    const listingId = request.data.listingId;
    const userId = request.auth.uid;

    if (!listingId) {
        throw new HttpsError(
            "invalid-argument",
            "Listing ID is required."
        );
    }

    try {
        // 2. Daily Quota Check (Max 20 reveals per day)
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const usageRef = admin.firestore().collection("usage").doc(`${userId}_${today}`);
        const usageDoc = await usageRef.get();
        const revealCount = usageDoc.data()?.revealCount || 0;

        if (revealCount >= 20) {
            // Log Abuse Attempt
            await admin.firestore().collection("abuse_events").add({
                userId,
                type: "DAILY_LIMIT_EXCEEDED",
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                listingId
            });
            throw new HttpsError(
                "resource-exhausted",
                "Daily reveal limit reached (20). Please try again tomorrow."
            );
        }

        // 3. Authorization Check (Has the user paid/unlocked this listing?)
        // We check the tenant's profile for the unlockedListing ID
        const userDoc = await admin.firestore().collection("tenants").doc(userId).get();
        const userData = userDoc.data();

        const isUnlocked = userData?.unlockedListings?.includes(listingId);

        // Also allow if the user is the landlord of this listing
        const listingDoc = await admin.firestore().collection("listings").doc(listingId).get();
        const listingData = listingDoc.data();

        if (!isUnlocked && listingData?.landlordId !== userId) {
            throw new HttpsError(
                "permission-denied",
                "You have not unlocked this listing. Please pay the unlock fee first."
            );
        }

        // 4. Fetch Landlord details from the normalized collection
        const landlordId = listingData?.landlordId;
        if (!landlordId) {
            throw new HttpsError("not-found", "Landlord information not found.");
        }

        const landlordDoc = await admin.firestore().collection("landlords").doc(landlordId).get();
        const landlordData = landlordDoc.data();

        if (!landlordDoc.exists) {
            throw new HttpsError("not-found", "Landlord profile not found.");
        }

        // 5. Increment Usage Counter
        await usageRef.set({
            revealCount: revealCount + 1,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Return ONLY the sensitive details
        return {
            name: landlordData?.name,
            phone: landlordData?.phone,
            email: landlordData?.email
        };
    } catch (error: any) {
        console.error("revealContact error:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "An error occurred while revealing contact.");
    }
});
