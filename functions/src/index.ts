import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenAI, Type } from "@google/genai";
import * as crypto from "crypto";

admin.initializeApp();

export const revealContact = onCall({
    concurrency: 80, // Allow 1 instance to handle up to 80 concurrent requests
    memory: "512MiB", // Valid v2 memory format
    timeoutSeconds: 30,
    region: "europe-west1" // Primary region (multi-region handled in firebase.json for deployment)
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

    if (!listingId || typeof listingId !== 'string' || listingId.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(listingId)) {
        throw new HttpsError(
            "invalid-argument",
            "Valid Listing ID is required."
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

/**
 * Enhanced Search Helper Cloud Function
 * Takes a messy user query and returns structured search terms.
 */
export const enhancedSearch = onCall({
    concurrency: 80,
    memory: "512MiB",
    timeoutSeconds: 30,
    region: "europe-west1"
}, async (request) => {
    // Basic rate limit check could be added here similar to revealContact if needed
    
    let query = request.data.query;
    if (!query || typeof query !== 'string') {
        throw new HttpsError("invalid-argument", "Query string is required.");
    }

    // Sanitize and limit query length to prevent injection or abuse
    query = query.trim().substring(0, 200).replace(/[<>{}[\];]/g, '');
    if (!query) {
        throw new HttpsError("invalid-argument", "Valid query string is required.");
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY environment variable is not set.");
            throw new HttpsError("internal", "Server configuration error.");
        }

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: `Translate this housing search query into search keywords: "${query}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                        unitTypeGuess: { type: Type.STRING, description: "Bedsitter, 1 Bedroom, 2 Bedroom, 3 Bedroom, 4 Bedroom, Own Compound, or Airbnb" },
                        maxPrice: { type: Type.NUMBER }
                    },
                    required: ["keywords"]
                }
            }
        });

        try {
            return JSON.parse(response.text || "{}");
        } catch (e) {
            console.error("Failed to parse Gemini JSON response", e);
            return { keywords: [query] };
        }
    } catch (error: any) {
        console.error("enhancedSearch error:", error);
        return { keywords: [query] };
    }
});

/**
 * Description Refiner Cloud Function
 * Polishes a raw property description into a professional and appealing marketing text.
 */
export const refineDescription = onCall({
    concurrency: 80,
    memory: "512MiB",
    timeoutSeconds: 30,
    region: "europe-west1"
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in to use this feature.");
    }

    let description = request.data.description;
    if (!description || typeof description !== 'string' || description.length < 10) {
        return { refined: description };
    }

    // Strict length limit and HTML tag stripping
    description = description.trim().substring(0, 5000).replace(/[<>{}]/g, '');

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY environment variable is not set.");
            throw new HttpsError("internal", "Server configuration error.");
        }

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: `You are a world-class real estate copywriter in Kenya. Refine the following property description for a listing in Kimana/Loitokitok/Illasit area. Make it professional, persuasive, and appealing to potential tenants while keeping it honest. 
            
            Original draft: "${description}"
            
            Provide ONLY the refined text without any introduction or pleasantries.`
        });

        return { refined: response.text?.trim() || description };
    } catch (error: any) {
        console.error("refineDescription error:", error);
        throw new HttpsError("internal", "An error occurred while refining the description.");
    }
});

/**
 * reCAPTCHA Verification Cloud Function
 * Submits the frontend token to Google reCAPTCHA Enterprise API for a risk assessment.
 */
export const verifyRecaptcha = onCall({
    minInstances: 0,
    concurrency: 80,
    memory: "256MiB",
    timeoutSeconds: 30,
    region: "europe-west1"
}, async (request) => {
    const { token, action } = request.data;
    if (!token) {
        throw new HttpsError("invalid-argument", "reCAPTCHA token is required.");
    }

    const apiKey = process.env.RECAPTCHA_API_KEY; 
    const siteKey = "6Lfm_nosAAAAADoemKEado5UgzoZdA5P_E9EmA0h"; 
    
    // Fallback if not set
    if (!apiKey) {
        console.error("RECAPTCHA_API_KEY environment variable is not set.");
        throw new HttpsError("internal", "Server configuration error.");
    }

    // Since the project might be inferred from the key or we can parse the site key's project, 
    // the user provided the REST API url as: 
    // `https://recaptchaenterprise.googleapis.com/v1/projects/my-portfolio-48f2c/assessments?key=API_KEY`
    const projectId = "my-portfolio-48f2c";
    const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: {
                    token: token,
                    expectedAction: action || "USER_ACTION",
                    siteKey: siteKey
                }
            })
        });

        if (!response.ok) {
            console.error("reCAPTCHA API error:", response.status, await response.text());
            throw new HttpsError("internal", "Error communicating with reCAPTCHA service.");
        }

        const data: any = await response.json();
        
        // Assert token is valid and score is acceptable
        if (data.tokenProperties?.valid) {
            const score = data.riskAnalysis?.score || 0;
            return { success: true, valid: true, score: score };
        } else {
            console.warn("reCAPTCHA invalid token:", data.tokenProperties?.invalidReason);
            return { success: false, valid: false, reason: data.tokenProperties?.invalidReason, score: 0 };
        }
    } catch (error: any) {
        console.error("reCAPTCHA verification exception:", error);
        throw new HttpsError("internal", "Error verifying reCAPTCHA.");
    }
});

/**
 * Initialize a Paystack checkout session for unlocking a listing.
 */
export const initializePayment = onCall({
    minInstances: 0,
    concurrency: 80,
    region: "europe-west1"
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in to initialize payment.");
    }

    const listingId = request.data.listingId;
    const userId = request.auth.uid;
    const email = request.data.email || request.auth.token?.email || "tenant@masqani.com";
    const callbackUrl = request.data.callbackUrl;

    if (!listingId) {
        throw new HttpsError("invalid-argument", "Listing ID is required.");
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
        console.error("PAYSTACK_SECRET_KEY is not configured.");
        throw new HttpsError("internal", "Payment gateway is not configured.");
    }

    try {
        const response = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${secretKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                amount: 100 * 100, // Ksh 100 in lowest denomination (10000)
                currency: "KES",
                callback_url: callbackUrl,
                metadata: {
                    userId: userId,
                    listingId: listingId
                }
            })
        });

        if (!response.ok) {
            console.error("Paystack API error:", response.status, await response.text());
            throw new HttpsError("internal", "Failed to initialize payment gateway.");
        }

        const data: any = await response.json();
        
        if (!data.status) {
            throw new HttpsError("internal", "Paystack returned a failure status.");
        }

        return {
            authorizationUrl: data.data.authorization_url,
            reference: data.data.reference
        };
    } catch (error: any) {
        console.error("initializePayment exception:", error);
        throw new HttpsError("internal", "Error initializing payment.");
    }
});

/**
 * Handle incoming webhooks from Paystack.
 */
export const paystackWebhook = onRequest({
    region: "europe-west1"
}, async (req, res) => {
    // Only accept POST requests
    if (req.method !== 'POST') {
        res.status(405).send("Method Not Allowed");
        return;
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
        console.error("PAYSTACK_SECRET_KEY is not configured.");
        res.status(500).send("Server Configuration Error");
        return;
    }

    // Verify Paystack Signature
    const hash = crypto.createHmac('sha512', secretKey).update(JSON.stringify(req.body)).digest('hex');
    const paystackSignature = req.headers['x-paystack-signature'];
    
    if (hash !== paystackSignature) {
        console.warn("Invalid Paystack webhook signature.");
        res.status(403).send("Invalid Signature");
        return;
    }

    // Process the event
    const event = req.body;
    
    // We only care about successful charges
    if (event.event === 'charge.success') {
        const data = event.data;
        const metadata = data.metadata;
        
        if (!metadata || !metadata.userId || !metadata.listingId) {
            console.error("Missing metadata in Paystack charge.success event:", metadata);
            res.status(400).send("Missing Metadata");
            return;
        }

        const { userId, listingId } = metadata;

        try {
            // Add the listing to the user's unlockedListings array
            await admin.firestore().collection("tenants").doc(userId).set({
                unlockedListings: admin.firestore.FieldValue.arrayUnion(listingId)
            }, { merge: true });

            console.log(`Successfully unlocked listing ${listingId} for user ${userId}`);
        } catch (error) {
            console.error("Error updating Firestore after payment:", error);
            // Even if DB fails, return 200 to Paystack so they don't retry unnecessarily
            res.status(200).send("Database Error (Acknowledged)");
            return;
        }
    }

    // Respond with 200 OK to acknowledge receipt
    res.status(200).send("OK");
});
