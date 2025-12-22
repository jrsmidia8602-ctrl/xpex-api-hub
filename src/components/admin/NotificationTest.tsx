import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube2, 
  Mail, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TestResult {
  type: 'email' | 'slack';
  status: 'pending' | 'success' | 'error';
  message: string;
  timestamp: string;
  responseTime?: number;
}

interface NotificationTestProps {
  notificationSettings: {
    enabled: boolean;
    type: 'email' | 'slack';
    recipient: string;
    onlyCritical: boolean;
  };
}

export const NotificationTest = ({ notificationSettings }: NotificationTestProps) => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const runTest = async () => {
    if (!notificationSettings.enabled || !notificationSettings.recipient) {
      toast({
        title: 'Configuração incompleta',
        description: 'Configure o destinatário antes de testar.',
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);
    const startTime = Date.now();

    const newResult: TestResult = {
      type: notificationSettings.type,
      status: 'pending',
      message: 'Enviando notificação de teste...',
      timestamp: new Date().toISOString(),
    };

    setTestResults(prev => [newResult, ...prev].slice(0, 10));

    try {
      const response = await supabase.functions.invoke('send-conversion-alert', {
        body: {
          type: notificationSettings.type,
          recipient: notificationSettings.recipient,
          alert: {
            eventName: 'test_notification',
            message: '🧪 Teste de notificação - Se você recebeu esta mensagem, a configuração está correta!',
            severity: 'warning',
            currentValue: 100,
            threshold: 50,
            createdAt: new Date().toISOString(),
          },
          isTest: true,
        },
      });

      const responseTime = Date.now() - startTime;

      if (response.error) {
        throw new Error(response.error.message);
      }

      setTestResults(prev => 
        prev.map((r, i) => i === 0 ? {
          ...r,
          status: 'success' as const,
          message: `Notificação enviada com sucesso para ${notificationSettings.recipient}`,
          responseTime,
        } : r)
      );

      toast({
        title: 'Teste concluído',
        description: `Notificação de teste enviada via ${notificationSettings.type.toUpperCase()}.`,
      });
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      setTestResults(prev => 
        prev.map((r, i) => i === 0 ? {
          ...r,
          status: 'error' as const,
          message: error.message || 'Falha ao enviar notificação',
          responseTime,
        } : r)
      );

      toast({
        title: 'Falha no teste',
        description: error.message || 'Não foi possível enviar a notificação de teste.',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">Testando...</Badge>;
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <TestTube2 className="w-5 h-5 text-primary" />
          Testar Notificações
        </CardTitle>
        <CardDescription>
          Verifique se Email/Slack está configurado corretamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Config */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Configuração Atual</span>
            <Badge variant={notificationSettings.enabled ? 'default' : 'outline'}>
              {notificationSettings.enabled ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          {notificationSettings.enabled ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {notificationSettings.type === 'email' ? (
                <Mail className="w-4 h-4" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              <span>
                {notificationSettings.type === 'email' ? 'Email: ' : 'Slack: '}
                {notificationSettings.recipient || 'Não configurado'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span>Ative as notificações na aba de configuração</span>
            </div>
          )}
        </div>

        {/* Test Button */}
        <Button
          onClick={runTest}
          disabled={testing || !notificationSettings.enabled || !notificationSettings.recipient}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando teste...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Enviar Notificação de Teste
            </>
          )}
        </Button>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Resultados dos Testes</p>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={`${result.timestamp}-${index}`}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  {getStatusIcon(result.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {result.type === 'email' ? (
                        <Mail className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <MessageSquare className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground uppercase">
                        {result.type}
                      </span>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm truncate">{result.message}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>
                        {new Date(result.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                      {result.responseTime && (
                        <span>{result.responseTime}ms</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-lg bg-muted/30">
          <p className="font-medium">Dicas de solução de problemas:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Para email: verifique se o domínio está validado no Resend</li>
            <li>Para Slack: use a URL completa do webhook</li>
            <li>Verifique se as credenciais estão corretas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
