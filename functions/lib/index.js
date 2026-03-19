"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refineDescription = exports.enhancedSearch = exports.revealContact = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const genai_1 = require("@google/genai");
admin.initializeApp();
exports.revealContact = (0, https_1.onCall)({
    minInstances: 1, // Keep 1 instance warm at all times to eliminate cold starts
    concurrency: 80, // Allow 1 instance to handle up to 80 concurrent requests
    memory: "512MiB", // Valid v2 memory format
    timeoutSeconds: 30,
    region: "us-central1" // Primary region (multi-region handled in firebase.json for deployment)
}, async (request) => {
    // 1. Authentication Check
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be logged in to reveal contact.");
    }
    const listingId = request.data.listingId;
    const userId = request.auth.uid;
    if (!listingId) {
        throw new https_1.HttpsError("invalid-argument", "Listing ID is required.");
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
            throw new https_1.HttpsError("resource-exhausted", "Daily reveal limit reached (20). Please try again tomorrow.");
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
            throw new https_1.HttpsError("permission-denied", "You have not unlocked this listing. Please pay the unlock fee first.");
        }
        // 4. Fetch Landlord details from the normalized collection
        const landlordId = listingData?.landlordId;
        if (!landlordId) {
            throw new https_1.HttpsError("not-found", "Landlord information not found.");
        }
        const landlordDoc = await admin.firestore().collection("landlords").doc(landlordId).get();
        const landlordData = landlordDoc.data();
        if (!landlordDoc.exists) {
            throw new https_1.HttpsError("not-found", "Landlord profile not found.");
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
    }
    catch (error) {
        console.error("revealContact error:", error);
        if (error instanceof https_1.HttpsError)
            throw error;
        throw new https_1.HttpsError("internal", "An error occurred while revealing contact.");
    }
});
/**
 * Enhanced Search Helper Cloud Function
 * Takes a messy user query and returns structured search terms.
 */
exports.enhancedSearch = (0, https_1.onCall)({
    minInstances: 1,
    concurrency: 80,
    memory: "512MiB",
    timeoutSeconds: 30,
    region: "us-central1"
}, async (request) => {
    // Basic rate limit check could be added here similar to revealContact if needed
    const query = request.data.query;
    if (!query || typeof query !== 'string') {
        throw new https_1.HttpsError("invalid-argument", "Query string is required.");
    }
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY environment variable is not set.");
            throw new https_1.HttpsError("internal", "Server configuration error.");
        }
        const ai = new genai_1.GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: `Translate this housing search query into search keywords: "${query}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        keywords: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                        unitTypeGuess: { type: genai_1.Type.STRING, description: "Bedsitter, 1 Bedroom, 2 Bedroom, 3 Bedroom, 4 Bedroom, Own Compound, or Airbnb" },
                        maxPrice: { type: genai_1.Type.NUMBER }
                    },
                    required: ["keywords"]
                }
            }
        });
        try {
            return JSON.parse(response.text || "{}");
        }
        catch (e) {
            console.error("Failed to parse Gemini JSON response", e);
            return { keywords: [query] };
        }
    }
    catch (error) {
        console.error("enhancedSearch error:", error);
        return { keywords: [query] };
    }
});
/**
 * Description Refiner Cloud Function
 * Polishes a raw property description into a professional and appealing marketing text.
 */
exports.refineDescription = (0, https_1.onCall)({
    minInstances: 1,
    concurrency: 80,
    memory: "512MiB",
    timeoutSeconds: 30,
    region: "us-central1"
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be logged in to use this feature.");
    }
    const description = request.data.description;
    if (!description || typeof description !== 'string' || description.length < 10) {
        return { refined: description };
    }
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY environment variable is not set.");
            throw new https_1.HttpsError("internal", "Server configuration error.");
        }
        const ai = new genai_1.GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: `You are a world-class real estate copywriter in Kenya. Refine the following property description for a listing in Kimana/Loitokitok/Illasit area. Make it professional, persuasive, and appealing to potential tenants while keeping it honest. 
            
            Original draft: "${description}"
            
            Provide ONLY the refined text without any introduction or pleasantries.`
        });
        return { refined: response.text?.trim() || description };
    }
    catch (error) {
        console.error("refineDescription error:", error);
        throw new https_1.HttpsError("internal", "An error occurred while refining the description.");
    }
});
//# sourceMappingURL=index.js.map