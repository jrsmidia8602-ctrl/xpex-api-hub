import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, BellRing, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const PushNotificationSettings = () => {
  const {
    isSupported,
    permission,
    isEnabled,
    requestPermission,
    disableNotifications,
    sendNotification,
  } = usePushNotifications();

  const handleToggle = () => {
    if (isEnabled) {
      disableNotifications();
    } else {
      requestPermission();
    }
  };

  const handleTestNotification = () => {
    sendNotification('Teste de Notificação 🔔', {
      body: 'Esta é uma notificação de teste. Tudo está funcionando!',
      tag: 'test',
    });
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notificações Push
            </CardTitle>
            <CardDescription className="mt-1.5">
              Receba alertas em tempo real no seu navegador
            </CardDescription>
          </div>
          <StatusBadge 
            isSupported={isSupported} 
            permission={permission} 
            isEnabled={isEnabled} 
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isSupported ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Seu navegador não suporta notificações push. Tente usar Chrome, Firefox ou Edge.
            </p>
          </div>
        ) : (
          <>
            {/* Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/30">
              <div className="flex items-center gap-3">
                {isEnabled ? (
                  <BellRing className="h-5 w-5 text-primary" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {isEnabled ? 'Notificações Ativadas' : 'Notificações Desativadas'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isEnabled 
                      ? 'Você receberá alertas em tempo real'
                      : 'Ative para receber alertas importantes'
                    }
                  </p>
                </div>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={handleToggle}
                disabled={permission === 'denied'}
              />
            </div>

            {/* Permission denied warning */}
            {permission === 'denied' && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-500">Permissão Bloqueada</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    As notificações foram bloqueadas nas configurações do navegador. 
                    Para ativar, clique no ícone de cadeado na barra de endereço e permita notificações.
                  </p>
                </div>
              </div>
            )}

            {/* Notification types */}
            {isEnabled && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Você receberá alertas para:</p>
                <div className="grid gap-2">
                  <NotificationTypeItem 
                    icon="⚠️" 
                    title="Limites de Uso" 
                    description="Quando atingir 50%, 75% ou 100% do limite" 
                  />
                  <NotificationTypeItem 
                    icon="💳" 
                    title="Créditos Baixos" 
                    description="Quando seus créditos estiverem acabando" 
                  />
                  <NotificationTypeItem 
                    icon="🏆" 
                    title="Novas Conquistas" 
                    description="Quando desbloquear uma nova conquista" 
                  />
                  <NotificationTypeItem 
                    icon="🔔" 
                    title="Atualizações do Sistema" 
                    description="Manutenções e novidades importantes" 
                  />
                </div>
              </div>
            )}

            {/* Test button */}
            {isEnabled && (
              <Button 
                variant="outline" 
                onClick={handleTestNotification}
                className="w-full"
              >
                <Bell className="h-4 w-4 mr-2" />
                Enviar Notificação de Teste
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface StatusBadgeProps {
  isSupported: boolean;
  permission: NotificationPermission;
  isEnabled: boolean;
}

const StatusBadge = ({ isSupported, permission, isEnabled }: StatusBadgeProps) => {
  if (!isSupported) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Não Suportado
      </Badge>
    );
  }

  if (permission === 'denied') {
    return (
      <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-500">
        <AlertTriangle className="h-3 w-3" />
        Bloqueado
      </Badge>
    );
  }

  if (isEnabled) {
    return (
      <Badge className="gap-1 bg-green-500/20 text-green-500 border-green-500/30">
        <CheckCircle className="h-3 w-3" />
        Ativo
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <BellOff className="h-3 w-3" />
      Desativado
    </Badge>
  );
};

interface NotificationTypeItemProps {
  icon: string;
  title: string;
  description: string;
}

const NotificationTypeItem = ({ icon, title, description }: NotificationTypeItemProps) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
    <span className="text-lg">{icon}</span>
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);
