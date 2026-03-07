import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const revealContact = functions.https.onCall(async (data, context) => {
    // 1. Authentication Check
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "User must be logged in to reveal contact."
        );
    }

    const listingId = data.listingId;
    const userId = context.auth.uid;

    if (!listingId) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Listing ID is required."
        );
    }

    try {
        // 2. Authorization Check (Has the user paid/unlocked this listing?)
        // We check the tenant's profile for the unlockedListing ID
        const userDoc = await admin.firestore().collection("tenants").doc(userId).get();
        const userData = userDoc.data();

        const isUnlocked = userData?.unlockedListings?.includes(listingId);

        // Also allow if the user is the landlord of this listing (though usually they don't need to call this)
        const listingDoc = await admin.firestore().collection("listings").doc(listingId).get();
        const listingData = listingDoc.data();

        if (!isUnlocked && listingData?.landlordId !== userId) {
            throw new functions.https.HttpsError(
                "permission-denied",
                "You have not unlocked this listing. Please pay the unlock fee first."
            );
        }

        // 3. Fetch Landlord details from the normalized collection
        const landlordId = listingData?.landlordId;
        if (!landlordId) {
            throw new functions.https.HttpsError("not-found", "Landlord information not found.");
        }

        const landlordDoc = await admin.firestore().collection("landlords").doc(landlordId).get();
        const landlordData = landlordDoc.data();

        if (!landlordDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Landlord profile not found.");
        }

        // Return ONLY the sensitive details
        return {
            name: landlordData?.name,
            phone: landlordData?.phone,
            email: landlordData?.email
        };
    } catch (error: any) {
        console.error("revealContact error:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", "An error occurred while revealing contact.");
    }
});
