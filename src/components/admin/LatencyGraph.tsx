import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useUsageLogs } from "@/hooks/useUsageLogs";
import { Loader2, Clock } from "lucide-react";
import { useMemo } from "react";

export const LatencyGraph = () => {
  const { logs, loading } = useUsageLogs();

  const chartData = useMemo(() => {
    // Group logs by minute and calculate avg latency
    const byMinute: Record<string, { times: number[], count: number }> = {};
    
    logs.forEach(log => {
      if (!log.response_time_ms) return;
      const minute = new Date(log.created_at).toISOString().slice(0, 16);
      if (!byMinute[minute]) {
        byMinute[minute] = { times: [], count: 0 };
      }
      byMinute[minute].times.push(log.response_time_ms);
      byMinute[minute].count++;
    });

    return Object.entries(byMinute)
      .map(([minute, data]) => ({
        time: new Date(minute).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        avg: Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length),
        max: Math.max(...data.times),
        min: Math.min(...data.times),
        count: data.count
      }))
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(-20);
  }, [logs]);

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-xl border border-border/50 flex items-center justify-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayData = chartData.length > 0 ? chartData : [{ time: 'Agora', avg: 0, max: 0, min: 0, count: 0 }];
  const avgLatency = chartData.length > 0 
    ? Math.round(chartData.reduce((acc, d) => acc + d.avg, 0) / chartData.length) 
    : 0;

  return (
    <div className="glass-card p-6 rounded-xl border border-border/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-display font-semibold text-foreground">
            Gráfico de Latência
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-neon-purple" />
            <span className="text-xs text-muted-foreground">Máx</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-neon-cyan" />
            <span className="text-xs text-muted-foreground">Média</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-400" />
            <span className="text-xs text-muted-foreground">Mín</span>
          </div>
        </div>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData}>
            <defs>
              <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--neon-purple))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--neon-purple))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10}
              fontFamily="JetBrains Mono"
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10}
              fontFamily="JetBrains Mono"
              tickFormatter={(value) => `${value}ms`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontFamily: "JetBrains Mono",
                fontSize: "12px"
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number, name: string) => [`${value}ms`, name === 'avg' ? 'Média' : name === 'max' ? 'Máximo' : 'Mínimo']}
            />
            <ReferenceLine 
              y={avgLatency} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="5 5" 
              label={{ value: `Avg: ${avgLatency}ms`, fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
            />
            <Area
              type="monotone"
              dataKey="max"
              stroke="hsl(var(--neon-purple))"
              fillOpacity={1}
              fill="url(#colorMax)"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="avg"
              stroke="hsl(var(--neon-cyan))"
              fillOpacity={1}
              fill="url(#colorAvg)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="min"
              stroke="#4ade80"
              fillOpacity={1}
              fill="url(#colorMin)"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
