/**
 * A utility service to sanitize user inputs before sending them to the backend / Firestore
 * This prevents XSS, HTML injection, and other script-based injection attacks
 * where user input is rendered back to the screen.
 */

export const SanitizerService = {
  /**
   * Strips all HTML tags from a string.
   */
  stripHtml: (input: string): string => {
    if (!input) return "";
    return input.replace(/<\/?[^>]+(>|$)/g, "");
  },

  /**
   * Specifically neutralizes script tags and javascript: URIs.
   */
  neutralizeScripts: (input: string): string => {
    if (!input) return "";
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    sanitized = sanitized.replace(/javascript:/gi, "blocked:");
    sanitized = sanitized.replace(/on\w+="[^"]*"/gi, ""); // remove inline events
    sanitized = sanitized.replace(/on\w+='[^']*'/gi, ""); 
    return sanitized;
  },

  /**
   * General-purpose strict text sanitizer (use for descriptions, titles)
   */
  sanitizeText: (input: string, maxLength?: number): string => {
    if (!input) return "";
    let clean = SanitizerService.stripHtml(input);
    clean = SanitizerService.neutralizeScripts(clean);
    clean = clean.trim();
    if (maxLength && clean.length > maxLength) {
        clean = clean.substring(0, maxLength);
    }
    return clean;
  },

  /**
   * Validation utility returning boolean 
   */
  isValidPhone: (phone: string): boolean => {
    return /^\+?[0-9]{10,15}$/.test(phone.replace(/\s+/g, ''));
  },
  
  isValidEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
};
