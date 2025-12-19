import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Server } from 'lucide-react';

interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'resolved' | 'investigating' | 'monitoring';
  severity: 'minor' | 'major' | 'critical';
  startedAt: Date;
  resolvedAt?: Date;
  affectedServices: string[];
}

const mockIncidents: Incident[] = [
  {
    id: '1',
    title: 'Latência elevada na API de validação',
    description: 'Identificamos latência aumentada nas respostas da API. Equipe investigando.',
    status: 'resolved',
    severity: 'minor',
    startedAt: new Date(Date.now() - 86400000 * 3),
    resolvedAt: new Date(Date.now() - 86400000 * 3 + 3600000),
    affectedServices: ['Gold Email Validator API'],
  },
  {
    id: '2',
    title: 'Manutenção programada - Atualização de infraestrutura',
    description: 'Atualização de segurança nos servidores. Impacto mínimo esperado.',
    status: 'resolved',
    severity: 'minor',
    startedAt: new Date(Date.now() - 86400000 * 7),
    resolvedAt: new Date(Date.now() - 86400000 * 7 + 7200000),
    affectedServices: ['Dashboard & Analytics', 'Webhook Delivery'],
  },
  {
    id: '3',
    title: 'Intermitência no serviço de webhooks',
    description: 'Alguns webhooks apresentaram falhas de entrega. Reprocessamento automático ativado.',
    status: 'resolved',
    severity: 'major',
    startedAt: new Date(Date.now() - 86400000 * 14),
    resolvedAt: new Date(Date.now() - 86400000 * 14 + 5400000),
    affectedServices: ['Webhook Delivery'],
  },
];

export const IncidentHistory = () => {
  const getStatusBadge = (status: Incident['status']) => {
    switch (status) {
      case 'resolved':
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30 gap-1">
            <CheckCircle className="h-3 w-3" />
            Resolvido
          </Badge>
        );
      case 'investigating':
        return (
          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 gap-1">
            <AlertTriangle className="h-3 w-3" />
            Investigando
          </Badge>
        );
      case 'monitoring':
        return (
          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 gap-1">
            <Clock className="h-3 w-3" />
            Monitorando
          </Badge>
        );
    }
  };

  const getSeverityColor = (severity: Incident['severity']) => {
    switch (severity) {
      case 'minor':
        return 'border-l-amber-500';
      case 'major':
        return 'border-l-orange-500';
      case 'critical':
        return 'border-l-red-500';
    }
  };

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const diff = endTime.getTime() - start.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          Histórico de Incidentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mockIncidents.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-foreground font-medium">Nenhum incidente recente</p>
            <p className="text-sm text-muted-foreground">
              Todos os sistemas estão operando normalmente
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {mockIncidents.map((incident) => (
              <div
                key={incident.id}
                className={`p-4 rounded-lg bg-muted/20 border border-border/30 border-l-4 ${getSeverityColor(incident.severity)}`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h4 className="font-medium text-foreground">{incident.title}</h4>
                  {getStatusBadge(incident.status)}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {incident.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {incident.startedAt.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  
                  {incident.resolvedAt && (
                    <span>
                      Duração: {formatDuration(incident.startedAt, incident.resolvedAt)}
                    </span>
                  )}
                  
                  <span>
                    Serviços: {incident.affectedServices.join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border/30 text-center">
          <p className="text-sm text-muted-foreground">
            90 dias de uptime: <span className="font-mono text-foreground">99.95%</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
