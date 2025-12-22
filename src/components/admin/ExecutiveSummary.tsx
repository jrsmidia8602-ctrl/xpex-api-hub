import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Key, 
  CreditCard, 
  Target,
  ArrowRight,
  RefreshCw,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface KPI {
  id: string;
  label: string;
  value: number;
  target: number;
  previousValue: number;
  format: 'number' | 'percentage' | 'currency';
  icon: React.ElementType;
  color: string;
}

interface FunnelSummary {
  visitors: number;
  signups: number;
  apiKeys: number;
  purchases: number;
  overallConversion: number;
}

const GOALS_KEY = "xpex_conversion_goals";

export const ExecutiveSummary = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [funnel, setFunnel] = useState<FunnelSummary>({
    visitors: 0,
    signups: 0,
    apiKeys: 0,
    purchases: 0,
    overallConversion: 0,
  });
  const [alertsCount, setAlertsCount] = useState({ critical: 0, warning: 0 });
  const [goalsAchieved, setGoalsAchieved] = useState({ achieved: 0, total: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch real data
      const [profilesRes, apiKeysRes, subscriptionsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('api_keys').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      const usersCount = profilesRes.count || 0;
      const apiKeysCount = apiKeysRes.count || 0;
      const subscriptionsCount = subscriptionsRes.count || 0;

      // Get events from localStorage
      const storedEvents = localStorage.getItem('xpex_analytics');
      let visitors = 15000;
      if (storedEvents) {
        const events = JSON.parse(storedEvents);
        visitors = events.filter((e: any) => e.name === 'page_view').length * 100 + 15000;
      }

      // Calculate funnel
      const overallConversion = visitors > 0 ? (subscriptionsCount / visitors) * 100 : 0;
      setFunnel({
        visitors,
        signups: usersCount,
        apiKeys: apiKeysCount,
        purchases: subscriptionsCount,
        overallConversion,
      });

      // Load goals
      const goalsRaw = localStorage.getItem(GOALS_KEY);
      let goals: any[] = [];
      if (goalsRaw) {
        try {
          goals = JSON.parse(goalsRaw);
        } catch {}
      }

      // Calculate goals achieved
      const funnelData = { 
        page_views: visitors, 
        signup_completed: usersCount, 
        api_key_generated: apiKeysCount,
        purchase_completed: subscriptionsCount,
      };
      
      const enabledGoals = goals.filter((g: any) => g.enabled);
      const achievedGoals = enabledGoals.filter((g: any) => {
        const key = g.stageId as keyof typeof funnelData;
        return (funnelData[key] || 0) >= g.targetCount;
      });
      
      setGoalsAchieved({
        achieved: achievedGoals.length,
        total: enabledGoals.length,
      });

      // Load alerts
      const alertsRaw = localStorage.getItem('xpex_conversion_alerts');
      if (alertsRaw) {
        try {
          const alerts = JSON.parse(alertsRaw);
          const unacknowledged = alerts.filter((a: any) => !a.acknowledged);
          setAlertsCount({
            critical: unacknowledged.filter((a: any) => a.severity === 'critical').length,
            warning: unacknowledged.filter((a: any) => a.severity === 'warning').length,
          });
        } catch {}
      }

      // Calculate KPIs with mock previous values for comparison
      const previousVisitors = visitors * 0.9;
      const previousSignups = usersCount * 0.85;
      const previousApiKeys = apiKeysCount * 0.8;
      const previousPurchases = subscriptionsCount * 0.75;

      // Get targets from goals
      const getTarget = (stageId: string, fallback: number) => {
        const goal = goals.find((g: any) => g.stageId === stageId && g.enabled);
        return goal?.targetCount || fallback;
      };

      setKpis([
        {
          id: 'visitors',
          label: 'Visitantes',
          value: visitors,
          target: getTarget('page_views', 20000),
          previousValue: previousVisitors,
          format: 'number',
          icon: Users,
          color: 'hsl(var(--chart-1))',
        },
        {
          id: 'signups',
          label: 'Cadastros',
          value: usersCount,
          target: getTarget('signup_completed', 2000),
          previousValue: previousSignups,
          format: 'number',
          icon: Users,
          color: 'hsl(var(--chart-2))',
        },
        {
          id: 'api_keys',
          label: 'API Keys',
          value: apiKeysCount,
          target: getTarget('api_key_generated', 500),
          previousValue: previousApiKeys,
          format: 'number',
          icon: Key,
          color: 'hsl(var(--chart-3))',
        },
        {
          id: 'purchases',
          label: 'Compras',
          value: subscriptionsCount,
          target: getTarget('purchase_completed', 200),
          previousValue: previousPurchases,
          format: 'number',
          icon: CreditCard,
          color: 'hsl(var(--chart-4))',
        },
        {
          id: 'conversion',
          label: 'Conversão Geral',
          value: overallConversion,
          target: 2,
          previousValue: previousPurchases / previousVisitors * 100,
          format: 'percentage',
          icon: Target,
          color: 'hsl(var(--chart-5))',
        },
      ]);

    } catch (error) {
      console.error('Error fetching executive summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatValue = (value: number, format: KPI['format']) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'currency':
        return `R$ ${value.toLocaleString('pt-BR')}`;
      default:
        return value.toLocaleString('pt-BR');
    }
  };

  const getChangePercent = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getProgressPercent = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Carregando resumo...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
              Resumo Executivo
            </CardTitle>
            <CardDescription>
              Visão geral dos KPIs principais e metas
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alerts & Goals Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <div className="p-3 rounded-full bg-primary/20">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Metas Atingidas</p>
              <p className="text-2xl font-bold">
                {goalsAchieved.achieved} / {goalsAchieved.total}
              </p>
            </div>
            <div className="ml-auto">
              <Progress 
                value={goalsAchieved.total > 0 ? (goalsAchieved.achieved / goalsAchieved.total) * 100 : 0} 
                className="w-24 h-2"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
            <div className={`p-3 rounded-full ${alertsCount.critical > 0 ? 'bg-destructive/20' : 'bg-muted'}`}>
              {alertsCount.critical > 0 ? (
                <AlertTriangle className="w-5 h-5 text-destructive" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alertas Ativos</p>
              <div className="flex items-center gap-2">
                {alertsCount.critical > 0 && (
                  <Badge variant="destructive">{alertsCount.critical} críticos</Badge>
                )}
                {alertsCount.warning > 0 && (
                  <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
                    {alertsCount.warning} avisos
                  </Badge>
                )}
                {alertsCount.critical === 0 && alertsCount.warning === 0 && (
                  <span className="text-sm text-green-500">Tudo OK</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpis.map((kpi) => {
            const change = getChangePercent(kpi.value, kpi.previousValue);
            const progress = getProgressPercent(kpi.value, kpi.target);
            const isPositive = change >= 0;
            const achieved = kpi.value >= kpi.target;

            return (
              <div
                key={kpi.id}
                className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div 
                    className="p-2 rounded-lg" 
                    style={{ backgroundColor: `${kpi.color}20` }}
                  >
                    <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                  </div>
                  {achieved && <Trophy className="w-4 h-4 text-yellow-500" />}
                </div>
                
                <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                <p className="text-xl font-bold mb-2">
                  {formatValue(kpi.value, kpi.format)}
                </p>

                <div className="flex items-center gap-2 mb-2">
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{change.toFixed(1)}%
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Meta</span>
                    <span>{formatValue(kpi.target, kpi.format)}</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                  <p className={`text-xs ${achieved ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {progress.toFixed(0)}% da meta
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Funnel Summary */}
        <div className="p-4 rounded-lg border bg-card">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-primary" />
            Fluxo de Conversão
          </h4>
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            <div className="text-center min-w-[80px]">
              <p className="text-lg font-bold">{funnel.visitors.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Visitantes</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="text-center min-w-[80px]">
              <p className="text-lg font-bold">{funnel.signups.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Cadastros</p>
              <Badge variant="outline" className="text-xs mt-1">
                {((funnel.signups / funnel.visitors) * 100).toFixed(1)}%
              </Badge>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="text-center min-w-[80px]">
              <p className="text-lg font-bold">{funnel.apiKeys.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">API Keys</p>
              <Badge variant="outline" className="text-xs mt-1">
                {funnel.signups > 0 ? ((funnel.apiKeys / funnel.signups) * 100).toFixed(1) : 0}%
              </Badge>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="text-center min-w-[80px]">
              <p className="text-lg font-bold text-green-500">{funnel.purchases.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Compras</p>
              <Badge variant="secondary" className="text-xs mt-1 bg-green-500/10 text-green-500">
                {funnel.overallConversion.toFixed(2)}% total
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
