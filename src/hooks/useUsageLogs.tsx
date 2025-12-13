import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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

export const useUsageLogs = () => {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchLogs = async () => {
    if (!user) {
      setLogs([]);
      setStats(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('usage_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching usage logs:', error);
    } else {
      setLogs(data || []);
      calculateStats(data || []);
    }
    setLoading(false);
  };

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
          setLogs(prev => [newLog, ...prev.slice(0, 99)]);
          calculateStats([newLog, ...logs.slice(0, 99)]);
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
    refetch: fetchLogs
  };
};
