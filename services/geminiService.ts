
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
