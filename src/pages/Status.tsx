import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Clock,
  TrendingUp,
  Server,
  RefreshCw,
  Database,
  CreditCard,
  Mail,
  Zap,
  Shield,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { IncidentHistory } from "@/components/admin/IncidentHistory";

interface HealthService {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms: number;
  message?: string;
  last_checked: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime_seconds: number;
  services: HealthService[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
  error?: string;
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  database: <Database className="w-5 h-5" />,
  stripe: <CreditCard className="w-5 h-5" />,
  email_service: <Mail className="w-5 h-5" />,
  edge_functions: <Zap className="w-5 h-5" />,
  authentication: <Shield className="w-5 h-5" />,
};

const SERVICE_LABELS: Record<string, string> = {
  database: 'Banco de Dados',
  stripe: 'Gateway de Pagamento',
  email_service: 'Serviço de Email',
  edge_functions: 'Funções Backend',
  authentication: 'Autenticação',
};

const Status = () => {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: invokeError } = await supabase.functions.invoke('health');
      
      if (invokeError) {
        throw new Error(invokeError.message);
      }
      
      setHealthData(data as HealthResponse);
      setLastRefresh(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar status';
      setError(errorMessage);
      toast.error('Falha ao carregar status do sistema');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchHealthData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealthData]);

  const getStatusIcon = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "unhealthy":
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case "healthy":
        return "Operacional";
      case "degraded":
        return "Desempenho Degradado";
      case "unhealthy":
        return "Indisponível";
    }
  };

  const getStatusColor = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case "healthy":
        return "text-green-500";
      case "degraded":
        return "text-yellow-500";
      case "unhealthy":
        return "text-red-500";
    }
  };

  const getStatusBadge = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Operacional</Badge>;
      case "degraded":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Degradado</Badge>;
      case "unhealthy":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Indisponível</Badge>;
    }
  };

  const formatUptime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
  };

  const calculateUptimePercentage = () => {
    if (!healthData) return 99.9;
    const { healthy, total } = healthData.summary;
    return total > 0 ? Math.round((healthy / total) * 100 * 100) / 100 : 0;
  };

  const avgResponseTime = healthData?.services 
    ? Math.round(healthData.services.reduce((acc, s) => acc + s.latency_ms, 0) / healthData.services.length)
    : 0;

  const allOperational = healthData?.status === 'healthy';

  return (
    <>
      <Helmet>
        <title>Status do Sistema - XPEX Neural</title>
        <meta
          name="description"
          content="Status em tempo real e métricas de uptime para todos os serviços da API XPEX Neural."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'border-green-500/50 text-green-500' : ''}
              >
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHealthData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Overall Status */}
          <div className="text-center mb-12">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
                error 
                  ? "bg-red-500/10 border border-red-500/20"
                  : allOperational
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-yellow-500/10 border border-yellow-500/20"
              }`}
            >
              {loading ? (
                <RefreshCw className="w-10 h-10 text-muted-foreground animate-spin" />
              ) : error ? (
                <XCircle className="w-10 h-10 text-red-500" />
              ) : allOperational ? (
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-yellow-500" />
              )}
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {loading 
                ? "Verificando sistemas..."
                : error 
                  ? "Erro ao verificar status"
                  : allOperational 
                    ? "Todos os Sistemas Operacionais" 
                    : healthData?.status === 'degraded'
                      ? "Desempenho Degradado"
                      : "Interrupção Parcial"
              }
            </h1>
            <p className="text-muted-foreground text-lg">
              {error 
                ? error
                : "Status em tempo real e métricas de desempenho"
              }
            </p>
            {healthData?.version && (
              <Badge variant="outline" className="mt-4">
                API v{healthData.version}
              </Badge>
            )}
          </div>

          {/* Uptime Overview */}
          <div className="grid gap-6 md:grid-cols-3 mb-12">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground text-sm">
                  Uptime Atual
                </span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {calculateUptimePercentage()}%
              </p>
              <Progress value={calculateUptimePercentage()} className="mt-3 h-2" />
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground text-sm">
                  Tempo de Resposta Médio
                </span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {avgResponseTime}ms
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {healthData?.uptime_seconds 
                  ? `Uptime: ${formatUptime(healthData.uptime_seconds)}`
                  : 'Carregando...'}
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Server className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground text-sm">
                  Serviços Ativos
                </span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {healthData?.summary.healthy || 0}/{healthData?.summary.total || 0}
              </p>
              <p className={`text-sm mt-2 ${
                healthData?.summary.unhealthy 
                  ? 'text-red-500' 
                  : healthData?.summary.degraded 
                    ? 'text-yellow-500' 
                    : 'text-green-500'
              }`}>
                {healthData?.summary.unhealthy 
                  ? `${healthData.summary.unhealthy} indisponível(is)`
                  : healthData?.summary.degraded 
                    ? `${healthData.summary.degraded} degradado(s)`
                    : 'Todos saudáveis'}
              </p>
            </div>
          </div>

          {/* Service List */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Status dos Serviços
              </h2>
              {healthData && getStatusBadge(healthData.status)}
            </div>

            <div className="divide-y divide-border/50">
              {loading && !healthData ? (
                <div className="p-6 text-center text-muted-foreground">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Carregando status dos serviços...
                </div>
              ) : error && !healthData ? (
                <div className="p-6 text-center text-muted-foreground">
                  <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  Não foi possível carregar o status dos serviços.
                </div>
              ) : (
                healthData?.services.map((service) => (
                  <div
                    key={service.name}
                    className="p-6 flex items-center justify-between hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        service.status === 'healthy' 
                          ? 'bg-green-500/10 text-green-500'
                          : service.status === 'degraded'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : 'bg-red-500/10 text-red-500'
                      }`}>
                        {SERVICE_ICONS[service.name] || <Server className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {SERVICE_LABELS[service.name] || service.name}
                        </h3>
                        <p className={`text-sm ${getStatusColor(service.status)}`}>
                          {service.message || getStatusText(service.status)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 text-sm">
                      <div className="text-right">
                        <p className="text-muted-foreground">Latência</p>
                        <p className={`font-medium ${
                          service.latency_ms > 1000 
                            ? 'text-red-500' 
                            : service.latency_ms > 500 
                              ? 'text-yellow-500' 
                              : 'text-foreground'
                        }`}>
                          {service.latency_ms}ms
                        </p>
                      </div>
                      <div className="w-8">
                        {getStatusIcon(service.status)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Incident History */}
          <IncidentHistory />

          {/* Last Updated */}
          <p className="text-center text-muted-foreground text-sm mt-8">
            Última atualização: {lastRefresh.toLocaleString('pt-BR')} • 
            {autoRefresh ? ' Atualização automática a cada 30 segundos' : ' Atualização automática desativada'}
          </p>
        </main>
      </div>
    </>
  );
};

export default Status;