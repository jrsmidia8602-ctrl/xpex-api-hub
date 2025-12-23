import { useState } from 'react';
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
  Check
} from 'lucide-react';
import { useWebhooks, WEBHOOK_EVENTS } from '@/hooks/useWebhooks';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="docs" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Documentação
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
