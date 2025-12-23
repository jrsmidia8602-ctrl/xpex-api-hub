import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Auto-backup helper
const triggerAutoBackup = async (userId: string) => {
  try {
    await supabase.functions.invoke('backup-configurations', {
      body: { backup_type: 'webhooks' }
    });
    console.log('Auto-backup triggered for webhooks');
  } catch (error) {
    console.error('Auto-backup failed:', error);
  }
};

export interface Webhook {
  id: string;
  user_id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status_code: number | null;
  response: string | null;
  success: boolean;
  attempts: number;
  created_at: string;
}

export const WEBHOOK_EVENTS = [
  { value: 'usage.threshold', label: 'Limite de uso atingido (80%)' },
  { value: 'usage.limit_reached', label: 'Limite de uso esgotado' },
  { value: 'credits.low', label: 'Créditos baixos (< 100)' },
  { value: 'credits.depleted', label: 'Créditos esgotados' },
  { value: 'api_key.created', label: 'API Key criada' },
  { value: 'api_key.deleted', label: 'API Key deletada' },
  { value: 'subscription.changed', label: 'Assinatura alterada' }
];

export const useWebhooks = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchWebhooks = async () => {
    if (!user) {
      setWebhooks([]);
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching webhooks:', error);
        return;
      }

      setWebhooks((data || []) as Webhook[]);

      // Fetch recent logs for all webhooks
      if (data && data.length > 0) {
        const webhookIds = data.map(w => w.id);
        const { data: logsData } = await supabase
          .from('webhook_logs')
          .select('*')
          .in('webhook_id', webhookIds)
          .order('created_at', { ascending: false })
          .limit(50);

        setLogs((logsData || []) as WebhookLog[]);
      }
    } catch (error) {
      console.error('Error in fetchWebhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async (name: string, url: string, events: string[]) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          user_id: user.id,
          name,
          url,
          events
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating webhook:', error);
        toast.error('Erro ao criar webhook');
        return null;
      }

      toast.success('Webhook criado com sucesso!');
      await fetchWebhooks();
      triggerAutoBackup(user.id);
      return data as Webhook;
    } catch (error) {
      console.error('Error in createWebhook:', error);
      toast.error('Erro ao criar webhook');
      return null;
    }
  };

  const updateWebhook = async (id: string, updates: Partial<Pick<Webhook, 'name' | 'url' | 'events' | 'active'>>) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating webhook:', error);
        toast.error('Erro ao atualizar webhook');
        return false;
      }

      toast.success('Webhook atualizado!');
      await fetchWebhooks();
      if (user) triggerAutoBackup(user.id);
      return true;
    } catch (error) {
      console.error('Error in updateWebhook:', error);
      toast.error('Erro ao atualizar webhook');
      return false;
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting webhook:', error);
        toast.error('Erro ao deletar webhook');
        return false;
      }

      toast.success('Webhook deletado!');
      await fetchWebhooks();
      if (user) triggerAutoBackup(user.id);
      return true;
    } catch (error) {
      console.error('Error in deleteWebhook:', error);
      toast.error('Erro ao deletar webhook');
      return false;
    }
  };

  const testWebhook = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-webhook', {
        body: {
          webhook_id: id,
          event_type: 'test',
          payload: {
            message: 'Este é um teste de webhook',
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        toast.error('Erro ao testar webhook');
        return false;
      }

      toast.success('Webhook de teste enviado!');
      await fetchWebhooks();
      return true;
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Erro ao testar webhook');
      return false;
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, [user]);

  return {
    webhooks,
    logs,
    loading,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    refetch: fetchWebhooks
  };
};
