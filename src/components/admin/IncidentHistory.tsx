import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Server, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface Incident {
  id: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  started_at: string;
  resolved_at: string | null;
  affected_services: string[];
}

export const IncidentHistory = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_incidents')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching incidents:', error);
        return;
      }

      setIncidents((data || []) as Incident[]);
    } catch (error) {
      console.error('Error in fetchIncidents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const getStatusBadge = (status: string) => {
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
      default:
        return (
          <Badge className="bg-muted/20 text-muted-foreground border-border/30 gap-1">
            {status}
          </Badge>
        );
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor':
        return 'border-l-amber-500';
      case 'major':
        return 'border-l-orange-500';
      case 'critical':
        return 'border-l-red-500';
      default:
        return 'border-l-muted';
    }
  };

  const formatDuration = (start: string, end: string | null) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diff = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          Histórico de Incidentes
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={fetchIncidents} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-foreground font-medium">Nenhum incidente recente</p>
            <p className="text-sm text-muted-foreground">
              Todos os sistemas estão operando normalmente
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => (
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
                    {formatDate(incident.started_at)}
                  </span>
                  
                  {incident.resolved_at && (
                    <span>
                      Duração: {formatDuration(incident.started_at, incident.resolved_at)}
                    </span>
                  )}
                  
                  {incident.affected_services.length > 0 && (
                    <span>
                      Serviços: {incident.affected_services.join(', ')}
                    </span>
                  )}
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
