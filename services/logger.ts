import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

export enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  SECURITY = "SECURITY"
}

export const LoggerService = {
  async logEvent(level: LogLevel, category: string, message: string, metadata: any = {}) {
    try {
      if (!db) return;
      const logsRef = collection(db, "logs");
      
      const logEntry = {
        level,
        category,
        message,
        metadata: {
          ...metadata,
          userId: auth.currentUser?.uid || 'anonymous',
          email: auth.currentUser?.email || 'N/A'
        },
        timestamp: Timestamp.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      await addDoc(logsRef, logEntry);
    } catch (e) {
      // Degrade gracefully - never block the main thread or crash the app for logging failures
      console.error("LoggerService failed to write to Firestore:", e);
    }
  },

  async logAuthAttempt(email: string, success: boolean, reason?: string) {
    await this.logEvent(
      success ? LogLevel.INFO : LogLevel.SECURITY,
      "AUTHENTICATION",
      success ? "Successful Login" : "Failed Login Attempt",
      { emailAttempted: email, reason }
    );
  },

  async logApiError(operation: string, error: any) {
    await this.logEvent(
      LogLevel.ERROR,
      "API_ERROR",
      `API Error during ${operation}`,
      { errorMessage: error.message || error.toString(), code: error.code }
    );
  }
};
