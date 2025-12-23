import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineStorage } from '@/lib/offlineStorage';

interface UseOfflineOptions<T> {
  cacheKey: string;
  fetchFn: () => Promise<T>;
  onSync?: (result: { synced: number; failed: number }) => void;
  enabled?: boolean;
}

interface UseOfflineResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isOffline: boolean;
  isStale: boolean;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
  syncPending: boolean;
}

export function useOffline<T>({
  cacheKey,
  fetchFn,
  onSync,
  enabled = true,
}: UseOfflineOptions<T>): UseOfflineResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [syncPending, setSyncPending] = useState(false);
  const mountedRef = useRef(true);

  // Load cached data on mount
  useEffect(() => {
    if (!enabled) return;

    const cached = offlineStorage.getCacheWithMeta<T>(cacheKey);
    if (cached) {
      setData(cached.data);
      setLastUpdated(new Date(cached.timestamp));
      setSyncPending(cached.syncPending);
      setIsStale(true);
    }
  }, [cacheKey, enabled]);

  // Listen for connection changes
  useEffect(() => {
    const unsubscribe = offlineStorage.onConnectionChange((online) => {
      if (mountedRef.current) {
        setIsOffline(!online);
        if (online) {
          // Sync and refetch when coming back online
          offlineStorage.syncPendingOperations().then((result) => {
            if (mountedRef.current) {
              onSync?.(result);
              refetch();
            }
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [onSync]);

  const refetch = useCallback(async () => {
    if (!enabled) return;

    if (!navigator.onLine) {
      setIsOffline(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      
      if (mountedRef.current) {
        setData(result);
        setIsStale(false);
        setLastUpdated(new Date());
        setSyncPending(false);
        offlineStorage.setCache(cacheKey, result, false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        
        // If fetch failed and we're offline, use cached data
        if (!navigator.onLine) {
          setIsOffline(true);
          const cached = offlineStorage.getCache<T>(cacheKey);
          if (cached) {
            setData(cached);
            setIsStale(true);
          }
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [cacheKey, fetchFn, enabled]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    
    if (enabled) {
      refetch();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [enabled]);

  return {
    data,
    loading,
    error,
    isOffline,
    isStale,
    lastUpdated,
    refetch,
    syncPending,
  };
}

export default useOffline;
