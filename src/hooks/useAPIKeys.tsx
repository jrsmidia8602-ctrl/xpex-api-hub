import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { analytics } from '@/lib/analytics';

export interface APIKey {
  id: string;
  name: string;
  key: string;
  status: string;
  calls_count: number;
  last_used_at: string | null;
  created_at: string;
}

export const useAPIKeys = () => {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchKeys = async () => {
    if (!user) {
      setKeys([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Erro ao carregar API keys');
    } else {
      setKeys(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchKeys();
  }, [user]);

  const generateKey = async (name: string) => {
    if (!user) return null;

    const newKey = `xpex_${crypto.randomUUID().replace(/-/g, '').substring(0, 24)}`;

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

    if (error) {
      console.error('Error creating API key:', error);
      toast.error('Erro ao criar API key');
      return null;
    }

    setKeys([data, ...keys]);
    toast.success('Nova API Key gerada!');
    analytics.trackAPIKeyGenerated(name);
    return data;
  };

  const deleteKey = async (id: string) => {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting API key:', error);
      toast.error('Erro ao remover API key');
      return false;
    }

    setKeys(keys.filter((k) => k.id !== id));
    toast.success('API Key removida');
    analytics.track('api_key_deleted', { key_id: id });
    return true;
  };

  const updateKeyStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('api_keys')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating API key:', error);
      toast.error('Erro ao atualizar API key');
      return false;
    }

    setKeys(keys.map((k) => (k.id === id ? { ...k, status } : k)));
    toast.success('Status atualizado');
    return true;
  };

  return {
    keys,
    loading,
    generateKey,
    deleteKey,
    updateKeyStatus,
    refetch: fetchKeys
  };
};
