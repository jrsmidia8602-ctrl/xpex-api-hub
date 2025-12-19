// Rate limiter utility for edge functions
// Stores rate limit data in memory (per edge function instance)

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
}

// In-memory store (resets on function cold start)
const rateLimitStore = new Map<string, RateLimitEntry>();

export function createRateLimiter(config: RateLimiterConfig) {
  const { maxRequests, windowMs } = config;

  return {
    check: (identifier: string): { allowed: boolean; remaining: number; resetAt: number } => {
      const now = Date.now();
      const entry = rateLimitStore.get(identifier);

      // Clean expired entry
      if (entry && now >= entry.resetAt) {
        rateLimitStore.delete(identifier);
      }

      const currentEntry = rateLimitStore.get(identifier);

      if (!currentEntry) {
        // First request
        const resetAt = now + windowMs;
        rateLimitStore.set(identifier, { count: 1, resetAt });
        return { allowed: true, remaining: maxRequests - 1, resetAt };
      }

      if (currentEntry.count >= maxRequests) {
        // Rate limited
        return { allowed: false, remaining: 0, resetAt: currentEntry.resetAt };
      }

      // Increment counter
      currentEntry.count++;
      return { allowed: true, remaining: maxRequests - currentEntry.count, resetAt: currentEntry.resetAt };
    },

    getRateLimitHeaders: (result: { remaining: number; resetAt: number }) => ({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
    }),
  };
}

// Default rate limits
export const API_RATE_LIMITS = {
  // Per API key: 100 requests per minute
  perApiKey: { maxRequests: 100, windowMs: 60 * 1000 },
  // Per IP: 30 requests per minute (for unauthenticated)
  perIp: { maxRequests: 30, windowMs: 60 * 1000 },
  // Strict: 10 requests per minute (for AI endpoints)
  strict: { maxRequests: 10, windowMs: 60 * 1000 },
};
