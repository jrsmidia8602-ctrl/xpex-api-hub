import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface MetricData {
  date: string;
  signups: number;
  apiKeys: number;
  checkouts: number;
  purchases: number;
  signupRate: number;
  apiKeyRate: number;
  checkoutRate: number;
  purchaseRate: number;
}

const PERIODS = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '14d', label: 'Últimos 14 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
];

const METRICS = [
  { key: 'signups', name: 'Signups', color: 'hsl(var(--chart-1))' },
  { key: 'apiKeys', name: 'API Keys', color: 'hsl(var(--chart-2))' },
  { key: 'checkouts', name: 'Checkouts', color: 'hsl(var(--chart-3))' },
  { key: 'purchases', name: 'Purchases', color: 'hsl(142, 76%, 36%)' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur border border-border/50 rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            {entry.name.includes('Rate') && '%'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ConversionTrendCharts = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState<MetricData[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['signups', 'purchases']);

  const generateHistoricalData = (days: number): MetricData[] => {
    const result: MetricData[] = [];
    const baseDate = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      
      // Generate realistic growth patterns
      const growthFactor = 1 + (days - i) / days * 0.3;
      const weekendFactor = [0, 6].includes(date.getDay()) ? 0.7 : 1;
      const seasonalFactor = 1 + Math.sin(i / 7 * Math.PI) * 0.1;
      
      const baseSignups = Math.floor(80 * growthFactor * weekendFactor * seasonalFactor + Math.random() * 30);
      const baseApiKeys = Math.floor(baseSignups * 0.6 + Math.random() * 20);
      const baseCheckouts = Math.floor(baseApiKeys * 0.25 + Math.random() * 10);
      const basePurchases = Math.floor(baseCheckouts * 0.7 + Math.random() * 5);
      
      const visitors = Math.floor(1500 * weekendFactor + Math.random() * 500);
      
      result.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        signups: baseSignups,
        apiKeys: baseApiKeys,
        checkouts: baseCheckouts,
        purchases: basePurchases,
        signupRate: Number(((baseSignups / visitors) * 100).toFixed(2)),
        apiKeyRate: Number(((baseApiKeys / baseSignups) * 100).toFixed(2)),
        checkoutRate: Number(((baseCheckouts / baseApiKeys) * 100).toFixed(2)),
        purchaseRate: Number(((basePurchases / baseCheckouts) * 100).toFixed(2)),
      });
    }

    return result;
  };

  const loadData = () => {
    setLoading(true);
    const days = parseInt(period.replace('d', ''));
    setTimeout(() => {
      setData(generateHistoricalData(days));
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const stats = useMemo(() => {
    if (data.length < 2) return null;

    const calculateTrend = (key: keyof MetricData) => {
      const recent = data.slice(-7).reduce((sum, d) => sum + (d[key] as number), 0);
      const previous = data.slice(-14, -7).reduce((sum, d) => sum + (d[key] as number), 0);
      const change = previous > 0 ? ((recent - previous) / previous) * 100 : 0;
      return {
        total: data.reduce((sum, d) => sum + (d[key] as number), 0),
        avg: data.reduce((sum, d) => sum + (d[key] as number), 0) / data.length,
        change: Number(change.toFixed(1)),
        trend: change >= 0 ? 'up' : 'down',
      };
    };

    return {
      signups: calculateTrend('signups'),
      apiKeys: calculateTrend('apiKeys'),
      checkouts: calculateTrend('checkouts'),
      purchases: calculateTrend('purchases'),
    };
  }, [data]);

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  if (loading) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Carregando tendências...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Tendência Histórica de Conversões
            </h3>
            <p className="text-sm text-muted-foreground">
              Acompanhe a evolução das métricas de conversão ao longo do tempo
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Metric toggles */}
        <div className="flex flex-wrap gap-2 mb-6">
          {METRICS.map(metric => (
            <Badge
              key={metric.key}
              variant={selectedMetrics.includes(metric.key) ? 'default' : 'outline'}
              className="cursor-pointer transition-all hover:scale-105"
              style={{
                backgroundColor: selectedMetrics.includes(metric.key) ? metric.color : 'transparent',
                borderColor: metric.color,
                color: selectedMetrics.includes(metric.key) ? 'white' : metric.color,
              }}
              onClick={() => toggleMetric(metric.key)}
            >
              {metric.name}
            </Badge>
          ))}
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {METRICS.map(metric => {
              const stat = stats[metric.key as keyof typeof stats];
              return (
                <div key={metric.key} className="p-4 rounded-lg bg-background/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{metric.name}</span>
                    <Badge
                      variant="outline"
                      className={stat.trend === 'up' ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'}
                    >
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 mr-1" />
                      )}
                      {Math.abs(stat.change)}%
                    </Badge>
                  </div>
                  <div className="text-xl font-bold" style={{ color: metric.color }}>
                    {stat.total.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Média: {stat.avg.toFixed(0)}/dia
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Main trend chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                {METRICS.map(metric => (
                  <linearGradient key={metric.key} id={`gradient-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metric.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {METRICS.filter(m => selectedMetrics.includes(m.key)).map(metric => (
                <Area
                  key={metric.key}
                  type="monotone"
                  dataKey={metric.key}
                  name={metric.name}
                  stroke={metric.color}
                  fillOpacity={1}
                  fill={`url(#gradient-${metric.key})`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Conversion rates chart */}
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Taxas de Conversão por Etapa
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="signupRate"
                name="Signup Rate"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="apiKeyRate"
                name="API Key Rate"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="checkoutRate"
                name="Checkout Rate"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="purchaseRate"
                name="Purchase Rate"
                stroke="hsl(142, 76%, 36%)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Combined metrics chart */}
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Volume vs Taxa de Conversão
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="signups"
                name="Signups"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
              <Bar
                yAxisId="left"
                dataKey="purchases"
                name="Purchases"
                fill="hsl(142, 76%, 36%)"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="purchaseRate"
                name="Purchase Rate"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
