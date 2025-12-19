import { Card } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { TrendingUp, Activity, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

interface UsageData {
  date: string;
  validations: number;
  apiCalls: number;
  successRate: number;
}

interface EndpointData {
  name: string;
  calls: number;
  avgLatency: number;
}

interface DistributionData {
  name: string;
  value: number;
  color: string;
}

interface AnalyticsChartsProps {
  usageData: UsageData[];
  endpointData: EndpointData[];
  distributionData: DistributionData[];
  hourlyData: { hour: string; calls: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur border border-border/50 rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const AnalyticsCharts = ({
  usageData,
  endpointData,
  distributionData,
  hourlyData,
}: AnalyticsChartsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Usage Trend Chart */}
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Tendência de Uso (7 dias)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={usageData}>
              <defs>
                <linearGradient id="colorValidations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorApiCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
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
              <Area
                type="monotone"
                dataKey="validations"
                name="Validations"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorValidations)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="apiCalls"
                name="API Calls"
                stroke="hsl(var(--chart-2))"
                fillOpacity={1}
                fill="url(#colorApiCalls)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Hourly Activity Chart */}
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Atividade por Hora (Hoje)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="hour"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="calls"
                name="Chamadas"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Endpoint Performance Chart */}
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Performance por Endpoint
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={endpointData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="calls" name="Chamadas" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              <Bar dataKey="avgLatency" name="Latência (ms)" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Distribution Pie Chart */}
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-primary" />
          Distribuição de Requisições
        </h3>
        <div className="h-64 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {distributionData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Success Rate Line Chart */}
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50 lg:col-span-2">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Taxa de Sucesso ao Longo do Tempo
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[90, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="successRate"
                name="Taxa de Sucesso (%)"
                stroke="hsl(142, 76%, 36%)"
                strokeWidth={3}
                dot={{ fill: 'hsl(142, 76%, 36%)', r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(142, 76%, 36%)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
