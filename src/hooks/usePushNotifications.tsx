import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isEnabled: boolean;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isEnabled: false,
  });

  useEffect(() => {
    const isSupported = 'Notification' in window;
    
    if (isSupported) {
      const permission = Notification.permission;
      const isEnabled = localStorage.getItem('pushNotificationsEnabled') === 'true';
      
      setState({
        isSupported,
        permission,
        isEnabled: permission === 'granted' && isEnabled,
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      toast.error('Seu navegador não suporta notificações push');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        localStorage.setItem('pushNotificationsEnabled', 'true');
        setState(prev => ({ ...prev, permission, isEnabled: true }));
        
        // Show a test notification
        new Notification('Notificações Ativadas! 🔔', {
          body: 'Você receberá alertas em tempo real sobre uso da API.',
          icon: '/favicon.ico',
          tag: 'test-notification',
        });
        
        toast.success('Notificações push ativadas com sucesso!');
        return true;
      } else {
        toast.error('Permissão para notificações negada');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Erro ao solicitar permissão de notificações');
      return false;
    }
  }, [state.isSupported]);

  const disableNotifications = useCallback(() => {
    localStorage.setItem('pushNotificationsEnabled', 'false');
    setState(prev => ({ ...prev, isEnabled: false }));
    toast.info('Notificações push desativadas');
  }, []);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!state.isEnabled || state.permission !== 'granted') {
      console.log('Notifications not enabled or permission not granted');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }, [state.isEnabled, state.permission]);

  // Usage alert notification helpers
  const sendUsageThresholdAlert = useCallback((percentage: number, current: number, limit: number) => {
    sendNotification(`⚠️ Alerta de Uso: ${percentage}%`, {
      body: `Você usou ${current.toLocaleString()} de ${limit.toLocaleString()} créditos mensais.`,
      tag: 'usage-threshold',
      requireInteraction: true,
    });
  }, [sendNotification]);

  const sendUsageLimitReachedAlert = useCallback(() => {
    sendNotification('🚨 Limite de Uso Atingido!', {
      body: 'Você atingiu 100% do seu limite mensal de créditos. Considere fazer upgrade do plano.',
      tag: 'usage-limit',
      requireInteraction: true,
    });
  }, [sendNotification]);

  const sendCreditsLowAlert = useCallback((remaining: number) => {
    sendNotification('💳 Créditos Baixos', {
      body: `Você tem apenas ${remaining} créditos restantes. Considere comprar mais.`,
      tag: 'credits-low',
      requireInteraction: true,
    });
  }, [sendNotification]);

  const sendNewAchievementAlert = useCallback((achievementName: string) => {
    sendNotification('🏆 Nova Conquista Desbloqueada!', {
      body: `Parabéns! Você desbloqueou: ${achievementName}`,
      tag: 'achievement',
    });
  }, [sendNotification]);

  return {
    ...state,
    requestPermission,
    disableNotifications,
    sendNotification,
    sendUsageThresholdAlert,
    sendUsageLimitReachedAlert,
    sendCreditsLowAlert,
    sendNewAchievementAlert,
  };
};
