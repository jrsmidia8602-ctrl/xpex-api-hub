import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Clock,
  BookOpen,
  Copy,
  Check,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import { useWebhooks, WEBHOOK_EVENTS } from '@/hooks/useWebhooks';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const CODE_EXAMPLES = {
  node: `const crypto = require('crypto');

function verifyWebhookSignature(req, secret) {
  const signatureHeader = req.headers['x-webhook-signature'];
  const body = JSON.stringify(req.body);
  
  // Parse signature header (format: t=timestamp,v1=signature)
  const parts = signatureHeader.split(',');
  const timestamp = parts.find(p => p.startsWith('t='))?.slice(2);
  const signature = parts.find(p => p.startsWith('v1='))?.slice(3);
  
  if (!timestamp || !signature) {
    throw new Error('Invalid signature header');
  }
  
  // Check timestamp (5 min tolerance)
  const webhookAge = Math.abs(Date.now() / 1000 - parseInt(timestamp));
  if (webhookAge > 300) {
    throw new Error('Webhook timestamp too old');
  }
  
  // Verify signature
  const signedPayload = \`\${timestamp}.\${body}\`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )) {
    throw new Error('Invalid signature');
  }
  
  return true;
}

// Express.js example
app.post('/webhook', express.json(), (req, res) => {
  try {
    verifyWebhookSignature(req, process.env.WEBHOOK_SECRET);
    // Process webhook...
    res.status(200).send('OK');
  } catch (err) {
    res.status(401).send('Unauthorized');
  }
});`,

  python: `import hmac
import hashlib
import time
from flask import Flask, request, abort

app = Flask(__name__)

def verify_webhook_signature(request, secret):
    signature_header = request.headers.get('X-Webhook-Signature')
    body = request.get_data(as_text=True)
    
    # Parse signature header (format: t=timestamp,v1=signature)
    parts = dict(p.split('=') for p in signature_header.split(','))
    timestamp = parts.get('t')
    signature = parts.get('v1')
    
    if not timestamp or not signature:
        raise ValueError('Invalid signature header')
    
    # Check timestamp (5 min tolerance)
    webhook_age = abs(time.time() - int(timestamp))
    if webhook_age > 300:
        raise ValueError('Webhook timestamp too old')
    
    # Verify signature
    signed_payload = f'{timestamp}.{body}'
    expected_signature = hmac.new(
        secret.encode(),
        signed_payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, expected_signature):
        raise ValueError('Invalid signature')
    
    return True

@app.route('/webhook', methods=['POST'])
def webhook():
    try:
        verify_webhook_signature(request, WEBHOOK_SECRET)
        # Process webhook...
        return 'OK', 200
    except ValueError:
        abort(401)`,

  php: `<?php

function verifyWebhookSignature($payload, $signatureHeader, $secret) {
    // Parse signature header (format: t=timestamp,v1=signature)
    $parts = [];
    foreach (explode(',', $signatureHeader) as $part) {
        list($key, $value) = explode('=', $part, 2);
        $parts[$key] = $value;
    }
    
    $timestamp = $parts['t'] ?? null;
    $signature = $parts['v1'] ?? null;
    
    if (!$timestamp || !$signature) {
        throw new Exception('Invalid signature header');
    }
    
    // Check timestamp (5 min tolerance)
    $webhookAge = abs(time() - (int)$timestamp);
    if ($webhookAge > 300) {
        throw new Exception('Webhook timestamp too old');
    }
    
    // Verify signature
    $signedPayload = $timestamp . '.' . $payload;
    $expectedSignature = hash_hmac('sha256', $signedPayload, $secret);
    
    if (!hash_equals($expectedSignature, $signature)) {
        throw new Exception('Invalid signature');
    }
    
    return true;
}

// Usage
$payload = file_get_contents('php://input');
$signatureHeader = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'];

try {
    verifyWebhookSignature($payload, $signatureHeader, $webhookSecret);
    // Process webhook...
    http_response_code(200);
    echo 'OK';
} catch (Exception $e) {
    http_response_code(401);
    echo 'Unauthorized';
}`
};

// Webhook Failures Chart Component
const WebhookFailuresChart = ({ logs }: { logs: Array<{ id: string; success: boolean; created_at: string; event_type: string; status_code: number | null }> }) => {
  const failureData = useMemo(() => {
    // Group failures by day (last 7 days)
    const now = new Date();
    const days: Record<string, { date: string; failures: number; successes: number; total: number }> = {};
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      days[key] = { 
        date: date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }), 
        failures: 0, 
        successes: 0,
        total: 0
      };
    }
    
    logs.forEach(log => {
      const logDate = new Date(log.created_at).toISOString().split('T')[0];
      if (days[logDate]) {
        days[logDate].total++;
        if (log.success) {
          days[logDate].successes++;
        } else {
          days[logDate].failures++;
        }
      }
    });
    
    return Object.values(days);
  }, [logs]);

  const failuresByType = useMemo(() => {
    const types: Record<string, { type: string; failures: number; successes: number }> = {};
    
    logs.forEach(log => {
      if (!types[log.event_type]) {
        types[log.event_type] = { type: log.event_type, failures: 0, successes: 0 };
      }
      if (log.success) {
        types[log.event_type].successes++;
      } else {
        types[log.event_type].failures++;
      }
    });
    
    return Object.values(types).sort((a, b) => b.failures - a.failures);
  }, [logs]);

  const stats = useMemo(() => {
    const total = logs.length;
    const failures = logs.filter(l => !l.success).length;
    const successRate = total > 0 ? Math.round(((total - failures) / total) * 100) : 100;
    
    // Most common error codes
    const errorCodes: Record<number, number> = {};
    logs.filter(l => !l.success && l.status_code).forEach(l => {
      errorCodes[l.status_code!] = (errorCodes[l.status_code!] || 0) + 1;
    });
    
    const topErrorCodes = Object.entries(errorCodes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([code, count]) => ({ code: parseInt(code), count }));
    
    return { total, failures, successRate, topErrorCodes };
  }, [logs]);

  const COLORS = ['hsl(var(--destructive))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>Nenhum log de webhook disponível</p>
        <p className="text-sm">Os dados aparecerão aqui após os primeiros envios</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total de Envios</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{stats.failures}</p>
          <p className="text-xs text-muted-foreground">Falhas</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <p className={`text-2xl font-bold ${stats.successRate >= 90 ? 'text-green-500' : stats.successRate >= 70 ? 'text-yellow-500' : 'text-destructive'}`}>
            {stats.successRate}%
          </p>
          <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
        </div>
      </div>

      {/* Failures Over Time Chart */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-destructive" />
          Falhas nos Últimos 7 Dias
        </h4>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={failureData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area 
                type="monotone" 
                dataKey="successes" 
                stackId="1"
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary)/0.3)" 
                name="Sucesso"
              />
              <Area 
                type="monotone" 
                dataKey="failures" 
                stackId="1"
                stroke="hsl(var(--destructive))" 
                fill="hsl(var(--destructive)/0.5)" 
                name="Falhas"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Failures by Event Type */}
      {failuresByType.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Falhas por Tipo de Evento
          </h4>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={failuresByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  type="category" 
                  dataKey="type" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={100}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="failures" name="Falhas" fill="hsl(var(--destructive))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Error Codes */}
      {stats.topErrorCodes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Códigos de Erro Frequentes</h4>
          <div className="flex flex-wrap gap-2">
            {stats.topErrorCodes.map(({ code, count }, index) => (
              <Badge 
                key={code} 
                variant="outline" 
                className="flex items-center gap-2"
                style={{ borderColor: COLORS[index] }}
              >
                <span className="font-mono">{code}</span>
                <span className="text-muted-foreground">({count}x)</span>
              </Badge>
            ))}
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            {stats.topErrorCodes.some(e => e.code === 500) && <p>• 500: Erro interno do servidor de destino</p>}
            {stats.topErrorCodes.some(e => e.code === 502) && <p>• 502: Gateway inválido</p>}
            {stats.topErrorCodes.some(e => e.code === 503) && <p>• 503: Serviço indisponível</p>}
            {stats.topErrorCodes.some(e => e.code === 504) && <p>• 504: Timeout do gateway</p>}
            {stats.topErrorCodes.some(e => e.code === 408) && <p>• 408: Timeout da requisição</p>}
            {stats.topErrorCodes.some(e => e.code === 429) && <p>• 429: Muitas requisições (rate limit)</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export const WebhooksManager = () => {
  const { webhooks, logs, loading, createWebhook, updateWebhook, deleteWebhook, testWebhook } = useWebhooks();
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
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

  const copyCode = (language: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(language);
    toast.success('Código copiado!');
    setTimeout(() => setCopiedCode(null), 2000);
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
        <Tabs defaultValue="webhooks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="failures" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              Falhas
            </TabsTrigger>
            <TabsTrigger value="docs" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Docs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="webhooks" className="space-y-4 mt-4">
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
          </TabsContent>

          <TabsContent value="failures" className="space-y-6 mt-4">
            <WebhookFailuresChart logs={logs} />
          </TabsContent>

          <TabsContent value="docs" className="space-y-6 mt-4">
            {/* Signature Format */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Formato da Assinatura HMAC-SHA256</h4>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Cada webhook enviado inclui um header <code className="bg-muted px-1 rounded">X-Webhook-Signature</code> 
                  com o formato:
                </p>
                <code className="block bg-background/50 p-3 rounded text-sm font-mono">
                  t=1234567890,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd
                </code>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <code className="bg-muted px-1 rounded">t</code> = timestamp Unix em segundos</li>
                  <li>• <code className="bg-muted px-1 rounded">v1</code> = assinatura HMAC-SHA256 em hexadecimal</li>
                </ul>
              </div>
            </div>

            {/* How it works */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Como Funciona</h4>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
                <p>1. Concatenamos o timestamp com o corpo do webhook: <code className="bg-muted px-1 rounded">{`{timestamp}.{body}`}</code></p>
                <p>2. Geramos HMAC-SHA256 usando seu secret como chave</p>
                <p>3. Verificamos se o timestamp está dentro de 5 minutos (proteção contra replay attacks)</p>
                <p>4. Comparamos a assinatura usando constant-time comparison (proteção contra timing attacks)</p>
              </div>
            </div>

            {/* Headers */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Headers Enviados</h4>
              <div className="bg-muted/30 rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="pb-2">Header</th>
                      <th className="pb-2">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    <tr>
                      <td className="py-1">X-Webhook-Signature</td>
                      <td className="py-1 text-muted-foreground">Assinatura HMAC-SHA256</td>
                    </tr>
                    <tr>
                      <td className="py-1">X-Webhook-Timestamp</td>
                      <td className="py-1 text-muted-foreground">Timestamp Unix</td>
                    </tr>
                    <tr>
                      <td className="py-1">X-Webhook-Event</td>
                      <td className="py-1 text-muted-foreground">Tipo do evento</td>
                    </tr>
                    <tr>
                      <td className="py-1">X-Webhook-Id</td>
                      <td className="py-1 text-muted-foreground">ID único da entrega</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Code Examples */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Exemplos de Código</h4>
              <Tabs defaultValue="node" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="node">Node.js</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="php">PHP</TabsTrigger>
                </TabsList>

                {Object.entries(CODE_EXAMPLES).map(([lang, code]) => (
                  <TabsContent key={lang} value={lang} className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyCode(lang, code)}
                    >
                      {copiedCode === lang ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <pre className="bg-background/50 rounded-lg p-4 overflow-x-auto text-xs">
                      <code className="text-muted-foreground">{code}</code>
                    </pre>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Best Practices */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Boas Práticas</h4>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
                <p>✓ Sempre verifique a assinatura antes de processar o webhook</p>
                <p>✓ Use constant-time comparison para evitar timing attacks</p>
                <p>✓ Verifique se o timestamp está dentro de 5 minutos</p>
                <p>✓ Armazene o secret de forma segura (variáveis de ambiente)</p>
                <p>✓ Retorne 200 rapidamente e processe de forma assíncrona</p>
                <p>✓ Implemente idempotência usando o X-Webhook-Id</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
