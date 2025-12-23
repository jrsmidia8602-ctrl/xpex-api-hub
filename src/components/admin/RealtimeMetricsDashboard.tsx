import { useEffect, useState } from 'react';
import { useUsageLogs } from '@/hooks/useUsageLogs';
import { useAlertThresholds } from '@/hooks/useAlertThresholds';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, Clock, Zap, TrendingUp, TrendingDown, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { AlertThresholdsConfig } from './AlertThresholdsConfig';

export const RealtimeMetricsDashboard = () => {
  const { stats, logs } = useUsageLogs();
  const { thresholds } = useAlertThresholds();
  const [pulse, setPulse] = useState(false);
  const [alertTriggered, setAlertTriggered] = useState<{ type: string; value: number } | null>(null);

  // Pulse animation on new data
  useEffect(() => {
    if (logs.length > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [logs.length]);

  // Check thresholds and trigger alerts
  useEffect(() => {
    if (!thresholds?.enabled || !stats) {
      setAlertTriggered(null);
      return;
    }

    const errorRate = logs.length > 0 
      ? (logs.filter(l => l.status_code >= 400).length / logs.length) * 100 
      : 0;
    const avgLatency = stats.avgResponseTime || 0;

    // Check latency threshold
    if (avgLatency > thresholds.latency_threshold_ms) {
      setAlertTriggered(prev => {
        if (prev?.type === 'latency' && prev?.value === avgLatency) return prev;
        toast.warning(`Alerta: Latência média (${avgLatency.toFixed(0)}ms) acima do limite (${thresholds.latency_threshold_ms}ms)`);
        return { type: 'latency', value: avgLatency };
      });
    }
    // Check error rate threshold
    else if (errorRate > thresholds.error_rate_threshold) {
      setAlertTriggered(prev => {
        if (prev?.type === 'error' && prev?.value === errorRate) return prev;
        toast.warning(`Alerta: Taxa de erro (${errorRate.toFixed(1)}%) acima do limite (${thresholds.error_rate_threshold}%)`);
        return { type: 'error', value: errorRate };
      });
    }
    else {
      setAlertTriggered(null);
    }
  }, [thresholds?.enabled, thresholds?.latency_threshold_ms, thresholds?.error_rate_threshold, stats?.avgResponseTime, logs.length]);

  // Calculate metrics
  const errorCount = logs.filter(l => l.status_code >= 400).length;
  const errorRate = logs.length > 0 ? (errorCount / logs.length) * 100 : 0;

  // Calculate latency percentiles
  const responseTimes = logs
    .filter(l => l.response_time_ms)
    .map(l => l.response_time_ms!)
    .sort((a, b) => a - b);
  
  const p50 = responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.5)] : 0;
  const p95 = responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.95)] : 0;
  const p99 = responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.99)] : 0;

  // Get recent errors
  const recentErrors = logs.filter(l => l.status_code >= 400).slice(0, 5);

  // Calculate requests per minute (approximate from last 100 logs)
  const now = Date.now();
  const recentLogs = logs.filter(l => now - new Date(l.created_at).getTime() < 60000);
  const rpm = recentLogs.length;

  const getLatencyColor = (ms: number) => {
    if (thresholds && ms > thresholds.latency_threshold_ms) return "text-red-400";
    if (ms > 500) return "text-yellow-400";
    return "text-green-400";
  };

  const getErrorRateColor = (rate: number) => {
    if (thresholds && rate > thresholds.error_rate_threshold) return "text-red-400";
    if (rate > 3) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alertTriggered && (
        <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center gap-3 animate-pulse">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div>
            <p className="font-medium text-red-400">
              {alertTriggered.type === 'latency' 
                ? `Alerta de Latência: ${alertTriggered.value.toFixed(0)}ms`
                : `Alerta de Taxa de Erro: ${alertTriggered.value.toFixed(1)}%`}
            </p>
            <p className="text-sm text-red-300">
              {alertTriggered.type === 'latency'
                ? `Limite configurado: ${thresholds?.latency_threshold_ms}ms`
                : `Limite configurado: ${thresholds?.error_rate_threshold}%`}
            </p>
          </div>
        </div>
      )}

      {/* Live Metrics Panel */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className={`h-5 w-5 text-primary ${pulse ? 'animate-ping' : ''}`} />
              <CardTitle>Métricas em Tempo Real</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-muted-foreground font-mono">LIVE</span>
              {thresholds?.enabled && (
                <Badge variant="outline" className="text-xs">
                  <Bell className="h-3 w-3 mr-1" />
                  Alertas Ativos
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <Zap className="h-4 w-4 text-neon-cyan" />
                <span className="text-xs text-muted-foreground font-mono">RPM</span>
              </div>
              <p className="text-2xl font-bold text-foreground font-mono">{rpm}</p>
              <p className="text-xs text-muted-foreground mt-1">req/min</p>
            </div>

            <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-xs text-muted-foreground font-mono">Success</span>
              </div>
              <p className="text-2xl font-bold text-green-400 font-mono">
                {stats?.successRate.toFixed(1) || 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">taxa de sucesso</p>
            </div>

            <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-xs text-muted-foreground font-mono">Errors</span>
              </div>
              <p className={`text-2xl font-bold font-mono ${getErrorRateColor(errorRate)}`}>
                {errorRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">{errorCount} erros</p>
            </div>

            <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground font-mono">Latency</span>
              </div>
              <p className={`text-2xl font-bold font-mono ${getLatencyColor(stats?.avgResponseTime || 0)}`}>
                {stats?.avgResponseTime.toFixed(0) || 0}ms
              </p>
              <p className="text-xs text-muted-foreground mt-1">média</p>
            </div>
          </div>

          {/* Latency Percentiles */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Percentis de Latência
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-secondary/20 text-center">
                <p className="text-xs text-muted-foreground mb-1">P50</p>
                <p className={`text-lg font-bold font-mono ${getLatencyColor(p50)}`}>
                  {p50}ms
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/20 text-center">
                <p className="text-xs text-muted-foreground mb-1">P95</p>
                <p className={`text-lg font-bold font-mono ${getLatencyColor(p95)}`}>
                  {p95}ms
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/20 text-center">
                <p className="text-xs text-muted-foreground mb-1">P99</p>
                <p className={`text-lg font-bold font-mono ${getLatencyColor(p99)}`}>
                  {p99}ms
                </p>
              </div>
            </div>
          </div>

          {/* Recent Errors */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Erros Recentes
              {recentErrors.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-mono">
                  {recentErrors.length}
                </span>
              )}
            </h4>
            
            {recentErrors.length === 0 ? (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                <p className="text-sm text-green-400 flex items-center justify-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Nenhum erro recente
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                {recentErrors.map((error) => (
                  <div 
                    key={error.id}
                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-mono">
                        {error.status_code}
                      </span>
                      <span className="text-sm text-foreground font-mono truncate max-w-[200px]">
                        {error.endpoint}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(error.created_at).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert Configuration */}
      <AlertThresholdsConfig />
    </div>
  );
};
