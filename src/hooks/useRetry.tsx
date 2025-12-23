import { useState, useCallback, useRef } from 'react';

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
  nextRetryIn: number | null;
}

interface UseRetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, delay: number) => void;
  onSuccess?: () => void;
  onMaxRetriesReached?: (error: Error) => void;
}

const defaultOptions: Required<Omit<UseRetryOptions, 'onRetry' | 'onSuccess' | 'onMaxRetriesReached'>> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
};

export const useRetry = (options: UseRetryOptions = {}) => {
  const opts = { ...defaultOptions, ...options };
  
  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    nextRetryIn: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearCountdown();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      nextRetryIn: null,
    });
  }, [clearCountdown]);

  const executeWithRetry = useCallback(async <T,>(
    fn: (signal?: AbortSignal) => Promise<T>,
    shouldRetry?: (error: unknown) => boolean
  ): Promise<T> => {
    reset();
    abortControllerRef.current = new AbortController();
    
    let lastError: Error | null = null;
    let delay = opts.initialDelay;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        const result = await fn(abortControllerRef.current.signal);
        setState(prev => ({ ...prev, isRetrying: false, retryCount: 0, lastError: null, nextRetryIn: null }));
        opts.onSuccess?.();
        return result;
      } catch (error) {
        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Operation cancelled');
        }

        lastError = error instanceof Error ? error : new Error(String(error));
        
        const canRetry = shouldRetry ? shouldRetry(error) : isNetworkError(error);
        
        if (attempt === opts.maxRetries || !canRetry) {
          setState(prev => ({ ...prev, isRetrying: false, lastError, nextRetryIn: null }));
          opts.onMaxRetriesReached?.(lastError);
          throw lastError;
        }

        // Calculate delay with jitter
        const jitter = Math.random() * 0.3 + 0.85;
        const actualDelay = Math.min(delay * jitter, opts.maxDelay);

        setState(prev => ({
          ...prev,
          isRetrying: true,
          retryCount: attempt + 1,
          lastError,
          nextRetryIn: Math.ceil(actualDelay / 1000),
        }));

        opts.onRetry?.(attempt + 1, actualDelay);

        // Start countdown
        let remainingSeconds = Math.ceil(actualDelay / 1000);
        countdownRef.current = setInterval(() => {
          remainingSeconds -= 1;
          if (remainingSeconds > 0) {
            setState(prev => ({ ...prev, nextRetryIn: remainingSeconds }));
          }
        }, 1000);

        await sleep(actualDelay);
        clearCountdown();
        
        delay *= opts.backoffFactor;
      }
    }

    throw lastError;
  }, [opts, reset, clearCountdown]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    reset();
  }, [reset]);

  return {
    ...state,
    executeWithRetry,
    reset,
    cancel,
  };
};

function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('failed to fetch') ||
      message.includes('timeout') ||
      message.includes('aborted') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    ) {
      return true;
    }
  }
  
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    return status >= 500 || status === 429;
  }
  
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default useRetry;
