/**
 * Retry utility with exponential backoff
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  shouldRetry: (error) => {
    // Retry on network errors or 5xx status codes
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
        return true;
      }
    }
    
    // Check for HTTP error status
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as { status: number }).status;
      return status >= 500 || status === 429;
    }
    
    return false;
  },
  onRetry: () => {},
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: unknown;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt or if we shouldn't retry this error
      if (attempt === opts.maxRetries || !opts.shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15 multiplier
      const actualDelay = Math.min(delay * jitter, opts.maxDelay);

      opts.onRetry(error, attempt + 1, actualDelay);

      await sleep(actualDelay);
      delay *= opts.backoffFactor;
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wrapper for Supabase function calls with retry
 */
export async function withSupabaseRetry<T>(
  fn: () => Promise<{ data: T | null; error: unknown }>
): Promise<{ data: T | null; error: unknown }> {
  return withRetry(async () => {
    const result = await fn();
    
    // If there's an error that looks like a network issue, throw to trigger retry
    if (result.error) {
      const errorMessage = String(result.error).toLowerCase();
      if (
        errorMessage.includes('network') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('failed to fetch') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('502') ||
        errorMessage.includes('503') ||
        errorMessage.includes('504')
      ) {
        throw result.error;
      }
    }
    
    return result;
  }, {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    onRetry: (error, attempt, delay) => {
      console.log(`Retry attempt ${attempt} after ${Math.round(delay)}ms:`, error);
    }
  });
}
