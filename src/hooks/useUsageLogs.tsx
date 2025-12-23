import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { withRetry } from '@/lib/retry';
import { offlineStorage } from '@/lib/offlineStorage';

export interface UsageLog {
  id: string;
  endpoint: string;
  status_code: number;
  response_time_ms: number | null;
  created_at: string;
  api_key_id: string | null;
}

export interface UsageStats {
  totalCalls: number;
  successRate: number;
  avgResponseTime: number;
  callsByDay: { date: string; count: number }[];
  callsByEndpoint: { endpoint: string; count: number }[];
}

const CACHE_KEY = 'usage_logs';

export const useUsageLogs = () => {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { user } = useAuth();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = offlineStorage.onConnectionChange((online) => {
      if (mountedRef.current) {
        setIsOffline(!online);
        if (online) {
          fetchLogs();
        }
      }
    });
    return unsubscribe;
  }, []);

  const calculateStats = (logsData: UsageLog[]) => {
    if (logsData.length === 0) {
      setStats({
        totalCalls: 0,
        successRate: 0,
        avgResponseTime: 0,
        callsByDay: [],
        callsByEndpoint: []
      });
      return;
    }

    const totalCalls = logsData.length;
    const successCalls = logsData.filter(l => l.status_code >= 200 && l.status_code < 300).length;
    const successRate = (successCalls / totalCalls) * 100;
    
    const responseTimes = logsData.filter(l => l.response_time_ms).map(l => l.response_time_ms!);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    // Group by day
    const byDay = logsData.reduce((acc, log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const callsByDay = Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);

    // Group by endpoint
    const byEndpoint = logsData.reduce((acc, log) => {
      acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const callsByEndpoint = Object.entries(byEndpoint)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count);

    setStats({
      totalCalls,
      successRate,
      avgResponseTime,
      callsByDay,
      callsByEndpoint
    });
  };

  const fetchLogs = async () => {
    if (!user) {
      setLogs([]);
      setStats(null);
      setLoading(false);
      return;
    }

    // Try to load from cache first
    const cached = offlineStorage.getCache<UsageLog[]>(CACHE_KEY);
    if (cached && !navigator.onLine) {
      setLogs(cached);
      calculateStats(cached);
      setIsOffline(true);
      setLoading(false);
      return;
    }

    try {
      const data = await withRetry(
        async () => {
          const { data, error } = await supabase
            .from('usage_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

          if (error) throw error;
          return data;
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (error, attempt) => {
            if (mountedRef.current) {
              setIsRetrying(true);
              console.log(`Retry attempt ${attempt} for usage logs fetch`);
            }
          },
        }
      );

      if (mountedRef.current) {
        setLogs(data || []);
        calculateStats(data || []);
        setIsRetrying(false);
        offlineStorage.setCache(CACHE_KEY, data || []);
      }
    } catch (error) {
      console.error('Error fetching usage logs:', error);
      if (mountedRef.current) {
        setIsRetrying(false);
        if (cached) {
          setLogs(cached);
          calculateStats(cached);
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('usage-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'usage_logs'
        },
        (payload) => {
          const newLog = payload.new as UsageLog;
          const updatedLogs = [newLog, ...logs.slice(0, 99)];
          setLogs(updatedLogs);
          calculateStats(updatedLogs);
          offlineStorage.setCache(CACHE_KEY, updatedLogs);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, logs]);

  return {
    logs,
    stats,
    loading,
    isRetrying,
    isOffline,
    refetch: fetchLogs
  };
};
