import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AlertThreshold {
  id: string;
  user_id: string;
  latency_threshold_ms: number;
  error_rate_threshold: number;
  enabled: boolean;
  last_alert_at: string | null;
  created_at: string;
  updated_at: string;
}

const defaultThresholds = {
  latency_threshold_ms: 1000,
  error_rate_threshold: 5.00,
  enabled: true,
};

export const useAlertThresholds = () => {
  const [thresholds, setThresholds] = useState<AlertThreshold | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchThresholds = useCallback(async () => {
    if (!user) {
      setThresholds(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('alert_thresholds')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching alert thresholds:', error);
        return;
      }

      if (data) {
        setThresholds(data as AlertThreshold);
      } else {
        // Create default thresholds
        const { data: newData, error: insertError } = await supabase
          .from('alert_thresholds')
          .insert({
            user_id: user.id,
            ...defaultThresholds,
          })
          .select()
          .single();

        if (!insertError && newData) {
          setThresholds(newData as AlertThreshold);
        }
      }
    } catch (error) {
      console.error('Error in fetchThresholds:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateThresholds = async (updates: Partial<Pick<AlertThreshold, 'latency_threshold_ms' | 'error_rate_threshold' | 'enabled'>>) => {
    if (!user || !thresholds) {
      toast.error('Você precisa estar logado');
      return false;
    }

    try {
      const { error } = await supabase
        .from('alert_thresholds')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', thresholds.id);

      if (error) {
        console.error('Error updating thresholds:', error);
        toast.error('Erro ao atualizar limites de alerta');
        return false;
      }

      setThresholds(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Limites de alerta atualizados!');
      return true;
    } catch (error) {
      console.error('Error in updateThresholds:', error);
      toast.error('Erro ao atualizar limites de alerta');
      return false;
    }
  };

  useEffect(() => {
    fetchThresholds();
  }, [fetchThresholds]);

  return {
    thresholds,
    loading,
    updateThresholds,
    refetch: fetchThresholds,
  };
};
