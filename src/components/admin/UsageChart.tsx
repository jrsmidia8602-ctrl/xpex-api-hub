import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Jan", calls: 4000, revenue: 240 },
  { name: "Fev", calls: 3000, revenue: 180 },
  { name: "Mar", calls: 5000, revenue: 300 },
  { name: "Abr", calls: 8000, revenue: 480 },
  { name: "Mai", calls: 6000, revenue: 360 },
  { name: "Jun", calls: 9500, revenue: 570 },
  { name: "Jul", calls: 12000, revenue: 720 },
];

export const UsageChart = () => {
  return (
    <div className="glass-card p-6 rounded-xl border border-border/50">
      <h3 className="text-lg font-display font-semibold text-foreground mb-6">
        Chamadas de API (Últimos 7 meses)
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--neon-cyan))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--neon-purple))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--neon-purple))" stopOpacity={0} />
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
              fill="url(#colorCalls)"
              strokeWidth={2}
              name="Chamadas"
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--neon-purple))"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              strokeWidth={2}
              name="Receita ($)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
