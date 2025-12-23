import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ConfigurationBackup {
  id: string;
  user_id: string;
  backup_type: 'webhooks' | 'notification_preferences' | 'full';
  data: Record<string, unknown>;
  created_at: string;
  expires_at: string;
}

export function useConfigurationBackups() {
  const [backups, setBackups] = useState<ConfigurationBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchBackups = async () => {
    if (!user) {
      setBackups([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('configuration_backups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBackups(data as ConfigurationBackup[]);
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('Erro ao carregar backups');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (backupType: 'webhooks' | 'notification_preferences' | 'full' = 'full') => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return null;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('backup-configurations', {
        body: { backup_type: backupType },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      toast.success('Backup criado com sucesso!');
      await fetchBackups();
      return data;
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Erro ao criar backup');
      return null;
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return null;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('restore-configurations', {
        body: { backup_id: backupId },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      toast.success('Backup restaurado com sucesso!');
      return data;
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Erro ao restaurar backup');
      return null;
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('configuration_backups')
        .delete()
        .eq('id', backupId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Backup excluído');
      await fetchBackups();
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Erro ao excluir backup');
    }
  };

  useEffect(() => {
    fetchBackups();
  }, [user]);

  return {
    backups,
    loading,
    createBackup,
    restoreBackup,
    deleteBackup,
    refetch: fetchBackups,
  };
}
