import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

const triggerAutoBackup = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.functions.invoke('backup-configurations', {
      body: { type: 'notification_preferences' },
    });
    console.log('Auto-backup triggered for notification preferences');
  } catch (error) {
    console.error('Error triggering auto-backup:', error);
  }
};

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  webhook_failures: boolean;
  usage_alerts: boolean;
  weekly_reports: boolean;
  created_at: string;
  updated_at: string;
}

const defaultPreferences = {
  email_enabled: true,
  push_enabled: true,
  in_app_enabled: true,
  webhook_failures: true,
  usage_alerts: true,
  weekly_reports: true,
};

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPreferences = async () => {
    if (!user) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching notification preferences:', error);
        return;
      }

      if (data) {
        setPreferences(data as NotificationPreferences);
      } else {
        // Create default preferences if none exist
        const { data: newData, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            ...defaultPreferences,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating notification preferences:', insertError);
        } else {
          setPreferences(newData as NotificationPreferences);
        }
      }
    } catch (error) {
      console.error('Error in fetchPreferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!user || !preferences) {
      toast.error('Você precisa estar logado');
      return false;
    }

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating notification preferences:', error);
        toast.error('Erro ao atualizar preferências');
        return false;
      }

      setPreferences({ ...preferences, ...updates } as NotificationPreferences);
      toast.success('Preferências atualizadas!');
      
      // Trigger auto-backup after successful update
      await triggerAutoBackup();
      
      return true;
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      toast.error('Erro ao atualizar preferências');
      return false;
    }
  }, [user, preferences]);

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  return {
    preferences,
    loading,
    updatePreferences,
    refetch: fetchPreferences,
  };
};
