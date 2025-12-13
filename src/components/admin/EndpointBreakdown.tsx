import { useUsageLogs } from "@/hooks/useUsageLogs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loader2, Layers } from "lucide-react";
import { useMemo } from "react";

export const EndpointBreakdown = () => {
  const { logs, stats, loading } = useUsageLogs();

  const endpointData = useMemo(() => {
    const byEndpoint: Record<string, { calls: number, errors: number, avgLatency: number, latencies: number[] }> = {};
    
    logs.forEach(log => {
      const endpoint = log.endpoint;
      if (!byEndpoint[endpoint]) {
        byEndpoint[endpoint] = { calls: 0, errors: 0, avgLatency: 0, latencies: [] };
      }
      byEndpoint[endpoint].calls++;
      if (log.status_code >= 400) {
        byEndpoint[endpoint].errors++;
      }
      if (log.response_time_ms) {
        byEndpoint[endpoint].latencies.push(log.response_time_ms);
      }
    });

    return Object.entries(byEndpoint)
      .map(([endpoint, data]) => ({
        endpoint: endpoint.length > 20 ? endpoint.substring(0, 20) + '...' : endpoint,
        fullEndpoint: endpoint,
        calls: data.calls,
        errors: data.errors,
        errorRate: ((data.errors / data.calls) * 100).toFixed(1),
        avgLatency: data.latencies.length > 0 
          ? Math.round(data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length) 
          : 0
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 6);
  }, [logs]);

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-xl border border-border/50 flex items-center justify-center h-[350px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayData = endpointData.length > 0 ? endpointData : [
    { endpoint: 'Sem dados', calls: 0, errors: 0, errorRate: '0', avgLatency: 0 }
  ];

  const colors = [
    'hsl(var(--neon-cyan))',
    'hsl(var(--neon-purple))',
    'hsl(var(--primary))',
    '#4ade80',
    '#facc15',
    '#f87171'
  ];

  return (
    <div className="glass-card p-6 rounded-xl border border-border/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-display font-semibold text-foreground">
            Breakdown por Endpoint
          </h3>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {stats?.callsByEndpoint.length || 0} endpoints
        </span>
      </div>

      {/* Bar Chart */}
      <div className="h-[180px] mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={displayData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
            <XAxis 
              type="number"
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10}
              fontFamily="JetBrains Mono"
            />
            <YAxis 
              type="category"
              dataKey="endpoint"
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10}
              fontFamily="JetBrains Mono"
              width={100}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontFamily: "JetBrains Mono",
                fontSize: "12px"
              }}
              formatter={(value: number, name: string, props: any) => [
                `${value} chamadas`,
                props.payload.fullEndpoint
              ]}
            />
            <Bar dataKey="calls" radius={[0, 4, 4, 0]}>
              {displayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Endpoint Details Table */}
      <div className="space-y-2">
        {endpointData.map((item, index) => (
          <div 
            key={item.fullEndpoint}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/30"
          >
            <div className="flex items-center gap-3">
              <div 
                className="h-3 w-3 rounded-full" 
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm font-mono text-foreground truncate max-w-[150px]">
                {item.endpoint}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-muted-foreground">
                {item.calls} calls
              </span>
              <span className={`${parseFloat(item.errorRate) > 5 ? 'text-red-400' : 'text-green-400'}`}>
                {item.errorRate}% err
              </span>
              <span className={`${item.avgLatency > 500 ? 'text-yellow-400' : 'text-foreground'}`}>
                {item.avgLatency}ms
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
