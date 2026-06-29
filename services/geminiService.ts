import { RateLimiter } from "./rateLimiter";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

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

  try {
    const callEnhancedSearch = httpsCallable<any, any>(functions, 'enhancedSearch');
    const result = await callEnhancedSearch({ query });
    return result.data || { keywords: [query] };
  } catch (error) {
    console.error("Error calling enhancedSearch function:", error);
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

  try {
    const callRefineDescription = httpsCallable<any, any>(functions, 'refineDescription');
    const result = await callRefineDescription({ description });
    return result.data?.refined || description;
  } catch (error) {
    console.error("Error calling refineDescription function:", error);
    return description;
  }
}
