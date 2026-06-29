/**
 * A simple client-side rate limiter using localStorage to prevent spamming
 * AI endpoints or database writes.
 */

export const RateLimiter = {
  checkLimit(action: string, maxRequests: number, timeWindowMs: number): void {
    const now = Date.now();
    const key = `rate_limit_${action}`;
    
    // 1. Retrieve history
    const historyRaw = localStorage.getItem(key);
    let history: number[] = [];
    
    if (historyRaw) {
      try {
        history = JSON.parse(historyRaw);
      } catch (e) {
        history = [];
      }
    }
    
    // 2. Filter out timestamps older than the time window
    const windowStart = now - timeWindowMs;
    const validHistory = history.filter(time => time > windowStart);
    
    // 3. Check limit
    if (validHistory.length >= maxRequests) {
      const waitTimeMinutes = Math.ceil((validHistory[0] - windowStart) / 60000);
      throw new Error(`Rate limit exceeded for ${action}. Please wait ${waitTimeMinutes} minutes before trying again.`);
    }
    
    // 4. Record new action
    validHistory.push(now);
    localStorage.setItem(key, JSON.stringify(validHistory));
  }
};
