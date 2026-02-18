
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Enhanced Search Helper:
 * Takes a messy user query and returns structured search terms.
 */
export async function getEnhancedSearchTerms(query: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a world-class real estate copywriter in Kenya. Refine the following property description for a listing in Kimana/Loitokitok area. Make it professional, persuasive, and appealing to potential tenants while keeping it honest. 
      
      Original draft: "${description}"
      
      Provide ONLY the refined text without any introduction or pleasantries.`,
    });
    
    return response.text?.trim() || description;
  } catch (e) {
    console.error("Gemini refinement failed:", e);
    return description;
  }
}
