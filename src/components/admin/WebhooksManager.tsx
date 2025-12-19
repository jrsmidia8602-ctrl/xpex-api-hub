import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Webhook, 
  Plus, 
  Trash2, 
  Play, 
  Eye, 
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { useWebhooks, WEBHOOK_EVENTS } from '@/hooks/useWebhooks';
import { Checkbox } from '@/components/ui/checkbox';

export const WebhooksManager = () => {
  const { webhooks, logs, loading, createWebhook, updateWebhook, deleteWebhook, testWebhook } = useWebhooks();
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: ['usage.threshold', 'usage.limit_reached', 'credits.low', 'credits.depleted']
  });

  const handleCreate = async () => {
    if (newWebhook.name && newWebhook.url) {
      await createWebhook(newWebhook.name, newWebhook.url, newWebhook.events);
      setNewWebhook({
        name: '',
        url: '',
        events: ['usage.threshold', 'usage.limit_reached', 'credits.low', 'credits.depleted']
      });
      setIsCreating(false);
    }
  };

  const toggleEvent = (event: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <Webhook className="h-5 w-5 text-neon-cyan" />
          Webhooks
        </CardTitle>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Nome</label>
                <Input
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Meu Webhook"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">URL</label>
                <Input
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://api.exemplo.com/webhook"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Eventos</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {WEBHOOK_EVENTS.map((event) => (
                    <div key={event.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={event.value}
                        checked={newWebhook.events.includes(event.value)}
                        onCheckedChange={() => toggleEvent(event.value)}
                      />
                      <label htmlFor={event.value} className="text-sm cursor-pointer">
                        {event.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!newWebhook.name || !newWebhook.url}>
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {webhooks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Webhook className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum webhook configurado</p>
            <p className="text-sm">Crie um webhook para receber notificações sobre uso de API</p>
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div 
                key={webhook.id}
                className="p-4 rounded-lg bg-muted/30 border border-border/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${webhook.active ? 'bg-green-400' : 'bg-muted'}`} />
                    <span className="font-medium">{webhook.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={webhook.active}
                      onCheckedChange={(active) => updateWebhook(webhook.id, { active })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => testWebhook(webhook.id)}
                      title="Testar webhook"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteWebhook(webhook.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground font-mono truncate">
                  {webhook.url}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Secret:</span>
                  <code className="text-xs bg-muted/50 px-2 py-1 rounded font-mono">
                    {showSecret[webhook.id] ? webhook.secret : '••••••••••••••••'}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowSecret(prev => ({ ...prev, [webhook.id]: !prev[webhook.id] }))}
                  >
                    {showSecret[webhook.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {webhook.events.map((event) => (
                    <Badge key={event} variant="secondary" className="text-xs">
                      {WEBHOOK_EVENTS.find(e => e.value === event)?.label || event}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Logs */}
        {logs.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border/30">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Logs Recentes
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {logs.slice(0, 10).map((log) => (
                <div 
                  key={log.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/20 text-xs"
                >
                  <div className="flex items-center gap-2">
                    {log.success ? (
                      <CheckCircle2 className="h-3 w-3 text-green-400" />
                    ) : (
                      <XCircle className="h-3 w-3 text-destructive" />
                    )}
                    <span className="font-mono">{log.event_type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{log.status_code || 'N/A'}</span>
                    <span>{new Date(log.created_at).toLocaleTimeString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
