import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  Shield, 
  TrendingUp, 
  Zap,
  RefreshCw,
  Bell,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsageLogs } from '@/hooks/useUsageLogs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';

// Rate limit configurations per tier
const TIER_LIMITS = {
  free: {
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 500,
    burstLimit: 5,
    color: 'hsl(var(--muted-foreground))',
    label: 'Gratuito'
  },
  starter: {
    requestsPerMinute: 30,
    requestsPerHour: 500,
    requestsPerDay: 5000,
    burstLimit: 15,
    color: 'hsl(var(--primary))',
    label: 'Starter'
  },
  professional: {
    requestsPerMinute: 100,
    requestsPerHour: 2000,
    requestsPerDay: 20000,
    burstLimit: 50,
    color: 'hsl(var(--chart-2))',
    label: 'Professional'
  },
  enterprise: {
    requestsPerMinute: 500,
    requestsPerHour: 10000,
    requestsPerDay: 100000,
    burstLimit: 200,
    color: 'hsl(var(--chart-4))',
    label: 'Enterprise'
  }
};

interface UsageStats {
  requestsThisMinute: number;
  requestsThisHour: number;
  requestsToday: number;
  peakMinute: number;
  avgResponseTime: number;
  rateLimitHits: number;
}

interface RateLimitAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export const RateLimitMonitor = () => {
  const { subscription } = useSubscription();
  const { logs, loading } = useUsageLogs();
  const [usageStats, setUsageStats] = useState<UsageStats>({
    requestsThisMinute: 0,
    requestsThisHour: 0,
    requestsToday: 0,
    peakMinute: 0,
    avgResponseTime: 0,
    rateLimitHits: 0
  });
  const [alerts, setAlerts] = useState<RateLimitAlert[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hour: string; requests: number; limit: number }[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentTier = subscription.tier || 'free';
  const limits = TIER_LIMITS[currentTier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;

  useEffect(() => {
    if (logs && logs.length > 0) {
      calculateUsageStats();
      generateHourlyData();
      checkForAlerts();
    }
  }, [logs]);

  const calculateUsageStats = () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    const requestsThisMinute = logs.filter(log => 
      new Date(log.created_at) > oneMinuteAgo
    ).length;

    const requestsThisHour = logs.filter(log => 
      new Date(log.created_at) > oneHourAgo
    ).length;

    const requestsToday = logs.filter(log => 
      new Date(log.created_at) > startOfDay
    ).length;

    const rateLimitHits = logs.filter(log => 
      log.status_code === 429
    ).length;

    const avgResponseTime = logs.length > 0
      ? logs.reduce((acc, log) => acc + (log.response_time_ms || 0), 0) / logs.length
      : 0;

    // Calculate peak minute usage
    const minuteBuckets: Record<string, number> = {};
    logs.forEach(log => {
      const minute = new Date(log.created_at).toISOString().slice(0, 16);
      minuteBuckets[minute] = (minuteBuckets[minute] || 0) + 1;
    });
    const peakMinute = Math.max(...Object.values(minuteBuckets), 0);

    setUsageStats({
      requestsThisMinute,
      requestsThisHour,
      requestsToday,
      peakMinute,
      avgResponseTime: Math.round(avgResponseTime),
      rateLimitHits
    });
  };

  const generateHourlyData = () => {
    const now = new Date();
    const data: { hour: string; requests: number; limit: number }[] = [];
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 3600000);
      const hourStr = hour.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const hourStart = new Date(hour);
      hourStart.setMinutes(0, 0, 0);
      const hourEnd = new Date(hourStart.getTime() + 3600000);
      
      const requests = logs.filter(log => {
        const logTime = new Date(log.created_at);
        return logTime >= hourStart && logTime < hourEnd;
      }).length;
      
      data.push({
        hour: hourStr,
        requests,
        limit: limits.requestsPerHour / 24 // Average hourly limit
      });
    }
    
    setHourlyData(data);
  };

  const checkForAlerts = () => {
    const newAlerts: RateLimitAlert[] = [];

    // Check minute usage
    const minuteUsagePercent = (usageStats.requestsThisMinute / limits.requestsPerMinute) * 100;
    if (minuteUsagePercent >= 90) {
      newAlerts.push({
        id: 'minute-critical',
        type: 'critical',
        message: `Uso por minuto em ${minuteUsagePercent.toFixed(0)}% do limite!`,
        timestamp: new Date(),
        resolved: false
      });
    } else if (minuteUsagePercent >= 70) {
      newAlerts.push({
        id: 'minute-warning',
        type: 'warning',
        message: `Uso por minuto atingiu ${minuteUsagePercent.toFixed(0)}% do limite`,
        timestamp: new Date(),
        resolved: false
      });
    }

    // Check hourly usage
    const hourUsagePercent = (usageStats.requestsThisHour / limits.requestsPerHour) * 100;
    if (hourUsagePercent >= 80) {
      newAlerts.push({
        id: 'hour-warning',
        type: 'warning',
        message: `Uso por hora em ${hourUsagePercent.toFixed(0)}% do limite`,
        timestamp: new Date(),
        resolved: false
      });
    }

    // Check if there were rate limit hits
    if (usageStats.rateLimitHits > 0) {
      newAlerts.push({
        id: 'rate-limit-hits',
        type: 'critical',
        message: `${usageStats.rateLimitHits} requisições bloqueadas por rate limiting`,
        timestamp: new Date(),
        resolved: false
      });
    }

    setAlerts(newAlerts);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    calculateUsageStats();
    generateHourlyData();
    checkForAlerts();
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRefreshing(false);
  };

  const getUsageColor = (current: number, limit: number) => {
    const percent = (current / limit) * 100;
    if (percent >= 90) return 'text-destructive';
    if (percent >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressColor = (current: number, limit: number) => {
    const percent = (current / limit) * 100;
    if (percent >= 90) return 'bg-destructive';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const tierComparisonData = Object.entries(TIER_LIMITS).map(([key, value]) => ({
    tier: value.label,
    perMinute: value.requestsPerMinute,
    perHour: value.requestsPerHour,
    perDay: value.requestsPerDay,
    isCurrent: key === currentTier
  }));

  const pieData = [
    { name: 'Usadas', value: usageStats.requestsToday, color: 'hsl(var(--primary))' },
    { name: 'Disponíveis', value: Math.max(0, limits.requestsPerDay - usageStats.requestsToday), color: 'hsl(var(--muted))' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rate Limit Monitor</h2>
          <p className="text-muted-foreground">
            Monitoramento em tempo real do uso de API e limites por tier
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className="px-3 py-1"
            style={{ borderColor: limits.color, color: limits.color }}
          >
            <Shield className="w-3 h-3 mr-1" />
            Tier: {limits.label}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <Alert 
              key={alert.id} 
              variant={alert.type === 'critical' ? 'destructive' : 'default'}
              className={alert.type === 'warning' ? 'border-yellow-500 bg-yellow-500/10' : ''}
            >
              {alert.type === 'critical' ? (
                <XCircle className="h-4 w-4" />
              ) : alert.type === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              <AlertTitle>
                {alert.type === 'critical' ? 'Crítico' : alert.type === 'warning' ? 'Atenção' : 'Info'}
              </AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requisições/Minuto</CardTitle>
            <Zap className={`h-4 w-4 ${getUsageColor(usageStats.requestsThisMinute, limits.requestsPerMinute)}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats.requestsThisMinute}
              <span className="text-sm font-normal text-muted-foreground">
                /{limits.requestsPerMinute}
              </span>
            </div>
            <Progress 
              value={(usageStats.requestsThisMinute / limits.requestsPerMinute) * 100} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requisições/Hora</CardTitle>
            <Clock className={`h-4 w-4 ${getUsageColor(usageStats.requestsThisHour, limits.requestsPerHour)}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats.requestsThisHour}
              <span className="text-sm font-normal text-muted-foreground">
                /{limits.requestsPerHour}
              </span>
            </div>
            <Progress 
              value={(usageStats.requestsThisHour / limits.requestsPerHour) * 100} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requisições/Dia</CardTitle>
            <Activity className={`h-4 w-4 ${getUsageColor(usageStats.requestsToday, limits.requestsPerDay)}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats.requestsToday}
              <span className="text-sm font-normal text-muted-foreground">
                /{limits.requestsPerDay}
              </span>
            </div>
            <Progress 
              value={(usageStats.requestsToday / limits.requestsPerDay) * 100} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bloqueios (429)</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${usageStats.rateLimitHits > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats.rateLimitHits}
              {usageStats.rateLimitHits > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  Rate Limited
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pico: {usageStats.peakMinute} req/min
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="hourly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hourly">Uso por Hora</TabsTrigger>
          <TabsTrigger value="tiers">Comparação de Tiers</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
        </TabsList>

        <TabsContent value="hourly">
          <Card>
            <CardHeader>
              <CardTitle>Requisições nas Últimas 24 Horas</CardTitle>
              <CardDescription>
                Visualização do uso da API ao longo do dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData}>
                    <defs>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="hour" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="requests" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorRequests)" 
                      name="Requisições"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers">
          <Card>
            <CardHeader>
              <CardTitle>Limites por Tier</CardTitle>
              <CardDescription>
                Compare os limites disponíveis em cada plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tierComparisonData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      dataKey="tier" 
                      type="category" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => value.toLocaleString()}
                    />
                    <Legend />
                    <Bar dataKey="perMinute" fill="hsl(var(--chart-1))" name="Por Minuto" />
                    <Bar dataKey="perHour" fill="hsl(var(--chart-2))" name="Por Hora" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Tier comparison table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Tier</th>
                      <th className="text-right py-2 font-medium">Req/Min</th>
                      <th className="text-right py-2 font-medium">Req/Hora</th>
                      <th className="text-right py-2 font-medium">Req/Dia</th>
                      <th className="text-right py-2 font-medium">Burst</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(TIER_LIMITS).map(([key, value]) => (
                      <tr 
                        key={key} 
                        className={`border-b ${key === currentTier ? 'bg-primary/10' : ''}`}
                      >
                        <td className="py-2 flex items-center gap-2">
                          {value.label}
                          {key === currentTier && (
                            <Badge variant="secondary" className="text-xs">Atual</Badge>
                          )}
                        </td>
                        <td className="text-right py-2">{value.requestsPerMinute.toLocaleString()}</td>
                        <td className="text-right py-2">{value.requestsPerHour.toLocaleString()}</td>
                        <td className="text-right py-2">{value.requestsPerDay.toLocaleString()}</td>
                        <td className="text-right py-2">{value.burstLimit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Uso Diário</CardTitle>
              <CardDescription>
                Proporção de uso em relação ao limite diário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-8">
                <div className="h-[250px] w-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => value.toLocaleString()}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium">Requisições Usadas</p>
                      <p className="text-2xl font-bold">{usageStats.requestsToday.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-muted" />
                    <div>
                      <p className="font-medium">Disponíveis</p>
                      <p className="text-2xl font-bold">
                        {Math.max(0, limits.requestsPerDay - usageStats.requestsToday).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Tempo médio de resposta
                    </p>
                    <p className="text-xl font-bold flex items-center gap-2">
                      {usageStats.avgResponseTime}ms
                      {usageStats.avgResponseTime < 200 && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upgrade CTA for free tier */}
      {currentTier === 'free' && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-full">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Precisa de mais requisições?</h3>
                <p className="text-sm text-muted-foreground">
                  Faça upgrade para aumentar seus limites em até 100x
                </p>
              </div>
            </div>
            <Button>Ver Planos</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
