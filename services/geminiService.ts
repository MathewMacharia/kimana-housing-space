import { GoogleGenAI, Type } from "@google/genai";
import { RateLimiter } from "./rateLimiter";

/**
 * Enhanced Search Helper:
 * Takes a messy user query and returns structured search terms.
 */
export async function getEnhancedSearchTerms(query: string) {
  try {
    // RATE LIMIT: Max 10 requests every 10 minutes
    RateLimiter.checkLimit('AI_SEARCH', 10, 10 * 60 * 1000);
  } catch (e: any) {
    console.warn("AI Search Rate Limit Exceeded. Falling back to simple search.", e.message);
    return { keywords: [query] };
  }

  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
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
    return JSON.parse(response.text);
  } catch (e) {
    return { keywords: [query] };
  }
}

/**
 * Description Refiner:
 * Polishes a raw property description into a professional and appealing marketing text.
 */
export async function refineDescription(description: string) {
  if (!description || description.length < 10) return description;
  
  try {
    // RATE LIMIT: Max 5 requests every hour to prevent abuse of the longer generation
    RateLimiter.checkLimit('AI_REFINE', 5, 60 * 60 * 1000);
  } catch (e: any) {
    console.warn("AI Refinement Rate Limit Exceeded. Falling back to original.", e.message);
    // Explicitly throw so the UI can alert the user
    throw new Error(e.message);
  }

  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: `You are a world-class real estate copywriter in Kenya. Refine the following property description for a listing in Kimana/Loitokitok/Illasit area. Make it professional, persuasive, and appealing to potential tenants while keeping it honest. 
      
      Original draft: "${description}"
      
      Provide ONLY the refined text without any introduction or pleasantries.`,
    });
    
    return response.text?.trim() || description;
  } catch (e) {
    console.error("Gemini refinement failed:", e);
    return description;
  }
}
