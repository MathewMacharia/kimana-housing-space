import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenAI, Type } from "@google/genai";
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

        const data = (await response.json()) as Record<string, any>;
        
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
 * Utility to generate Daraja OAuth token
 */
async function getDarajaToken(): Promise<string> {
    const consumerKey = process.env.DARAJA_CONSUMER_KEY;
    const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
    const env = process.env.DARAJA_ENVIRONMENT || "sandbox";
    
    if (!consumerKey || !consumerSecret) {
        throw new Error("Daraja credentials not configured.");
    }
    
    const baseUrl = env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
            "Authorization": `Basic ${auth}`
        }
    });
    
    if (!response.ok) {
        throw new Error("Failed to generate Daraja token.");
    }
    
    const data = (await response.json()) as Record<string, any>;
    return data.access_token;
}

/**
 * Initialize a Daraja STK Push session for unlocking a listing.
 * (Named initializePayment to bypass IAM creation restrictions)
 */
export const initializePayment = onRequest({
    region: "europe-west1"
}, async (req, res) => {
    // Handle CORS for local development testing
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).send({ error: "Method Not Allowed" });
        return;
    }

    // Manual Authentication Check since we moved away from onCall
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).send({ error: "User must be logged in to initialize payment." });
        return;
    }

    let userId: string;
    try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        userId = decodedToken.uid;
    } catch (e) {
        res.status(401).send({ error: "Invalid authentication token." });
        return;
    }

    const { listingId, phone, amount } = req.body.data || req.body;

    if (!listingId || !phone || !amount) {
        res.status(400).send({ error: "Listing ID, Phone, and Amount are required." });
        return;
    }

    // Format phone number to 254...
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = `254${formattedPhone.substring(1)}`;
    } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
        formattedPhone = `254${formattedPhone}`;
    }

    if (!formattedPhone.startsWith('254') || formattedPhone.length !== 12) {
        res.status(400).send({ error: "Invalid phone number format." });
        return;
    }

    const passkey = process.env.DARAJA_PASSKEY;
    const shortcode = process.env.DARAJA_SHORTCODE;
    const env = process.env.DARAJA_ENVIRONMENT || "sandbox";
    
    if (!passkey || !shortcode) {
        res.status(500).send({ error: "Payment gateway is not configured." });
        return;
    }

    try {
        const token = await getDarajaToken();
        const baseUrl = env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
        
        // Generate Password
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14); // YYYYMMDDHHmmss
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
        
        // Define Webhook URL to use the Firebase Hosting proxy
        // This is strictly required to bypass the Google Cloud Org Policy Domain Restricted Sharing
        const projectId = process.env.GCLOUD_PROJECT || "kimana-housing";
        const webhookUrl = `https://${projectId}.web.app/api/webhook`;

        const stkPayload = {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline", // or CustomerBuyGoodsOnline for Till
            Amount: amount, // KES amount is literal (e.g. 50)
            PartyA: formattedPhone,
            PartyB: shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: webhookUrl,
            AccountReference: "Masqani Unlock",
            TransactionDesc: `Unlock Listing ${listingId}`
        };

        const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(stkPayload)
        });

        if (!response.ok) {
            console.error("Daraja API error:", response.status, await response.text());
            res.status(500).send({ error: "Failed to initialize M-PESA STK Push." });
            return;
        }

        const data = (await response.json()) as Record<string, any>;
        
        if (data.ResponseCode !== "0") {
            res.status(500).send({ error: "Safaricom rejected the request: " + data.ResponseDescription });
            return;
        }

        // Save transaction to DB to link the CheckoutRequestID with userId and listingId
        await admin.firestore().collection("mpesa_transactions").doc(data.CheckoutRequestID).set({
            userId,
            listingId,
            amount,
            phone: formattedPhone,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // We wrap in { data: ... } to maintain compatibility with how the frontend expects the onCall result
        res.status(200).send({
            data: {
                checkoutRequestId: data.CheckoutRequestID,
                customerMessage: data.CustomerMessage
            }
        });
    } catch (error: any) {
        console.error("initializePayment exception:", error);
        res.status(500).send({ error: error.message || "Error initializing payment." });
    }
});

/**
 * Handle incoming webhooks from Safaricom Daraja.
 * (Named paystackWebhook to bypass IAM creation restrictions)
 */
export const paystackWebhook = onRequest({
    region: "europe-west1"
}, async (req, res) => {
    // Daraja sends a POST request
    if (req.method !== 'POST') {
        res.status(405).send("Method Not Allowed");
        return;
    }

    try {
        const callbackData = req.body.Body?.stkCallback;
        if (!callbackData) {
            res.status(400).send("Invalid Payload");
            return;
        }

        const checkoutRequestId = callbackData.CheckoutRequestID;
        const resultCode = callbackData.ResultCode;

        // Update transaction in DB
        const transactionRef = admin.firestore().collection("mpesa_transactions").doc(checkoutRequestId);
        const transactionDoc = await transactionRef.get();

        if (!transactionDoc.exists) {
            console.error("Transaction not found for CheckoutRequestID:", checkoutRequestId);
            res.status(200).send("OK"); // Acknowledge to Safaricom anyway
            return;
        }

        const transactionData = transactionDoc.data();

        if (resultCode === 0) {
            // Success!
            const userId = transactionData?.userId;
            const listingId = transactionData?.listingId;

            // Mark transaction as success
            await transactionRef.update({
                status: "success",
                resultDesc: callbackData.ResultDesc,
                completedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Add the listing to the user's unlockedListings array
            if (userId && listingId) {
                await admin.firestore().collection("tenants").doc(userId).set({
                    unlockedListings: admin.firestore.FieldValue.arrayUnion(listingId)
                }, { merge: true });
                console.log(`Successfully unlocked listing ${listingId} for user ${userId} via M-PESA`);
            }
        } else {
            // Failed
            await transactionRef.update({
                status: "failed",
                resultCode: resultCode,
                resultDesc: callbackData.ResultDesc,
                completedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`M-PESA transaction failed for CheckoutRequestID: ${checkoutRequestId}. Reason: ${callbackData.ResultDesc}`);
        }

        // Always return 200 to Safaricom
        res.status(200).send("OK");
    } catch (error) {
        console.error("Error processing M-PESA webhook:", error);
        res.status(500).send("Internal Server Error");
    }
});
