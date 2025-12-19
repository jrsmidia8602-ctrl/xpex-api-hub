import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Json } from '@/integrations/supabase/types';

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchLogs = useCallback(async () => {
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching audit logs:', error);
    } else {
      setLogs((data as AuditLog[]) || []);
    }
    setLoading(false);
  }, [user]);

  const logAction = useCallback(async (
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Json
  ) => {
    if (!user) return;

    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: user.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId || null,
        details: details || null,
        user_agent: navigator.userAgent
      }]);

    if (error) {
      console.error('Error logging action:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('audit-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          const newLog = payload.new as AuditLog;
          if (newLog.user_id === user.id) {
            setLogs(prev => [newLog, ...prev.slice(0, 99)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    logs,
    loading,
    logAction,
    refetch: fetchLogs
  };
};
