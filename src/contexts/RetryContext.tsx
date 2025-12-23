import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { RetryIndicator } from '@/components/RetryIndicator';

interface RetryContextValue {
  showRetrying: (retryCount: number, nextRetryIn: number | null) => void;
  hideRetrying: () => void;
  setOnCancel: (fn: (() => void) | undefined) => void;
  setOnRetryNow: (fn: (() => void) | undefined) => void;
}

const RetryContext = createContext<RetryContextValue | null>(null);

export const useRetryContext = () => {
  const context = useContext(RetryContext);
  if (!context) {
    throw new Error('useRetryContext must be used within RetryProvider');
  }
  return context;
};

interface RetryProviderProps {
  children: ReactNode;
}

export const RetryProvider = ({ children }: RetryProviderProps) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [nextRetryIn, setNextRetryIn] = useState<number | null>(null);
  const [onCancel, setOnCancelFn] = useState<(() => void) | undefined>();
  const [onRetryNow, setOnRetryNowFn] = useState<(() => void) | undefined>();

  const showRetrying = useCallback((count: number, nextIn: number | null) => {
    setIsRetrying(true);
    setRetryCount(count);
    setNextRetryIn(nextIn);
  }, []);

  const hideRetrying = useCallback(() => {
    setIsRetrying(false);
    setRetryCount(0);
    setNextRetryIn(null);
  }, []);

  const setOnCancel = useCallback((fn: (() => void) | undefined) => {
    setOnCancelFn(() => fn);
  }, []);

  const setOnRetryNow = useCallback((fn: (() => void) | undefined) => {
    setOnRetryNowFn(() => fn);
  }, []);

  return (
    <RetryContext.Provider value={{ showRetrying, hideRetrying, setOnCancel, setOnRetryNow }}>
      {children}
      <RetryIndicator
        isRetrying={isRetrying}
        retryCount={retryCount}
        nextRetryIn={nextRetryIn}
        onCancel={onCancel}
        onRetryNow={onRetryNow}
      />
    </RetryContext.Provider>
  );
};

export default RetryProvider;
