import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, Smartphone, MessageSquare, AlertTriangle, BarChart3, FileText } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { Skeleton } from '@/components/ui/skeleton';

export const NotificationPreferences = () => {
  const { preferences, loading, updatePreferences } = useNotificationPreferences();

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="py-8 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Faça login para gerenciar suas preferências de notificação.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Preferências de Notificação
        </CardTitle>
        <CardDescription>
          Configure como deseja receber alertas e notificações do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Canais de Notificação */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            Canais de Entrega
            <Badge variant="outline" className="text-xs">Onde receber</Badge>
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                  <p className="text-xs text-muted-foreground">Receba notificações no seu email cadastrado</p>
                </div>
              </div>
              <Switch
                id="email"
                checked={preferences.email_enabled}
                onCheckedChange={(checked) => updatePreferences({ email_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <Label htmlFor="push" className="text-foreground font-medium">Push (Navegador)</Label>
                  <p className="text-xs text-muted-foreground">Notificações instantâneas no navegador</p>
                </div>
              </div>
              <Switch
                id="push"
                checked={preferences.push_enabled}
                onCheckedChange={(checked) => updatePreferences({ push_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <Label htmlFor="inapp" className="text-foreground font-medium">In-App</Label>
                  <p className="text-xs text-muted-foreground">Notificações dentro do painel</p>
                </div>
              </div>
              <Switch
                id="inapp"
                checked={preferences.in_app_enabled}
                onCheckedChange={(checked) => updatePreferences({ in_app_enabled: checked })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Tipos de Notificação */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            Tipos de Alerta
            <Badge variant="outline" className="text-xs">O que receber</Badge>
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <Label htmlFor="webhook_failures" className="text-foreground font-medium">Falhas de Webhook</Label>
                  <p className="text-xs text-muted-foreground">Alertas quando webhooks falharem após todas as tentativas</p>
                </div>
              </div>
              <Switch
                id="webhook_failures"
                checked={preferences.webhook_failures}
                onCheckedChange={(checked) => updatePreferences({ webhook_failures: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <Label htmlFor="usage_alerts" className="text-foreground font-medium">Alertas de Uso</Label>
                  <p className="text-xs text-muted-foreground">Avisos de limite de uso e créditos baixos</p>
                </div>
              </div>
              <Switch
                id="usage_alerts"
                checked={preferences.usage_alerts}
                onCheckedChange={(checked) => updatePreferences({ usage_alerts: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <Label htmlFor="weekly_reports" className="text-foreground font-medium">Relatório Semanal</Label>
                  <p className="text-xs text-muted-foreground">Resumo semanal de performance dos webhooks</p>
                </div>
              </div>
              <Switch
                id="weekly_reports"
                checked={preferences.weekly_reports}
                onCheckedChange={(checked) => updatePreferences({ weekly_reports: checked })}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground text-center">
            As preferências são salvas automaticamente ao alterar qualquer opção.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
