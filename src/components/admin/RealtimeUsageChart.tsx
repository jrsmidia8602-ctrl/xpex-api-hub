import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useUsageLogs } from "@/hooks/useUsageLogs";
import { Loader2 } from "lucide-react";

export const RealtimeUsageChart = () => {
  const { stats, loading } = useUsageLogs();

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-xl border border-border/50 flex items-center justify-center h-[350px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Transform data for chart
  const chartData = stats?.callsByDay.map(item => ({
    name: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    calls: item.count
  })) || [];

  // If no data, show placeholder data
  const displayData = chartData.length > 0 ? chartData : [
    { name: 'Hoje', calls: 0 }
  ];

  return (
    <div className="glass-card p-6 rounded-xl border border-border/50">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-display font-semibold text-foreground">
          Chamadas de API (Tempo Real)
        </h3>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">LIVE</span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 rounded-lg bg-secondary/30">
          <p className="text-2xl font-bold text-foreground">{stats?.totalCalls || 0}</p>
          <p className="text-xs text-muted-foreground">Total Chamadas</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-secondary/30">
          <p className="text-2xl font-bold text-green-400">{stats?.successRate.toFixed(1) || 0}%</p>
          <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-secondary/30">
          <p className="text-2xl font-bold text-primary">{stats?.avgResponseTime.toFixed(0) || 0}ms</p>
          <p className="text-xs text-muted-foreground">Tempo Médio</p>
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData}>
            <defs>
              <linearGradient id="colorCallsRealtime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              fontFamily="JetBrains Mono"
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              fontFamily="JetBrains Mono"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontFamily: "JetBrains Mono"
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Area
              type="monotone"
              dataKey="calls"
              stroke="hsl(var(--neon-cyan))"
              fillOpacity={1}
              fill="url(#colorCallsRealtime)"
              strokeWidth={2}
              name="Chamadas"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
