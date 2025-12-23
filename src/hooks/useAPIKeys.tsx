import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { analytics } from '@/lib/analytics';
import { withRetry } from '@/lib/retry';
import { offlineStorage } from '@/lib/offlineStorage';

export interface APIKey {
  id: string;
  name: string;
  key: string;
  status: string;
  calls_count: number;
  last_used_at: string | null;
  created_at: string;
}

const CACHE_KEY = 'api_keys';

export const useAPIKeys = () => {
  const [keys, setKeys] = useState<APIKey[]>([]);
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
          fetchKeys();
        }
      }
    });
    return unsubscribe;
  }, []);

  const fetchKeys = async () => {
    if (!user) {
      setKeys([]);
      setLoading(false);
      return;
    }

    // Try to load from cache first
    const cached = offlineStorage.getCache<APIKey[]>(CACHE_KEY);
    if (cached && !navigator.onLine) {
      setKeys(cached);
      setIsOffline(true);
      setLoading(false);
      return;
    }

    try {
      const data = await withRetry(
        async () => {
          const { data, error } = await supabase
            .from('api_keys')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data;
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (error, attempt) => {
            if (mountedRef.current) {
              setIsRetrying(true);
              console.log(`Retry attempt ${attempt} for API keys fetch`);
            }
          },
        }
      );

      if (mountedRef.current) {
        setKeys(data || []);
        setIsRetrying(false);
        offlineStorage.setCache(CACHE_KEY, data || []);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
      if (mountedRef.current) {
        setIsRetrying(false);
        // Use cached data on failure
        if (cached) {
          setKeys(cached);
        }
        toast.error('Erro ao carregar API keys');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [user]);

  const generateKey = async (name: string) => {
    if (!user) return null;

    const newKey = `xpex_${crypto.randomUUID().replace(/-/g, '').substring(0, 24)}`;

    try {
      const data = await withRetry(
        async () => {
          const { data, error } = await supabase
            .from('api_keys')
            .insert({
              user_id: user.id,
              name,
              key: newKey,
              status: 'active'
            })
            .select()
            .single();

          if (error) throw error;
          return data;
        },
        {
          maxRetries: 2,
          initialDelay: 1000,
        }
      );

      setKeys([data, ...keys]);
      offlineStorage.setCache(CACHE_KEY, [data, ...keys]);
      toast.success('Nova API Key gerada!');
      analytics.trackAPIKeyGenerated(name);
      return data;
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Erro ao criar API key');
      return null;
    }
  };

  const deleteKey = async (id: string) => {
    try {
      await withRetry(
        async () => {
          const { error } = await supabase
            .from('api_keys')
            .delete()
            .eq('id', id);

          if (error) throw error;
        },
        {
          maxRetries: 2,
          initialDelay: 1000,
        }
      );

      const updatedKeys = keys.filter((k) => k.id !== id);
      setKeys(updatedKeys);
      offlineStorage.setCache(CACHE_KEY, updatedKeys);
      toast.success('API Key removida');
      analytics.track('api_key_deleted', { key_id: id });
      return true;
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Erro ao remover API key');
      return false;
    }
  };

  const updateKeyStatus = async (id: string, status: string) => {
    try {
      await withRetry(
        async () => {
          const { error } = await supabase
            .from('api_keys')
            .update({ status })
            .eq('id', id);

          if (error) throw error;
        },
        {
          maxRetries: 2,
          initialDelay: 1000,
        }
      );

      const updatedKeys = keys.map((k) => (k.id === id ? { ...k, status } : k));
      setKeys(updatedKeys);
      offlineStorage.setCache(CACHE_KEY, updatedKeys);
      toast.success('Status atualizado');
      return true;
    } catch (error) {
      console.error('Error updating API key:', error);
      toast.error('Erro ao atualizar API key');
      return false;
    }
  };

  return {
    keys,
    loading,
    isRetrying,
    isOffline,
    generateKey,
    deleteKey,
    updateKeyStatus,
    refetch: fetchKeys
  };
};
