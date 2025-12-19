import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChartDataPoint {
  date: string;
  referrals: number;
  credits: number;
  cumulative: number;
}

export const ReferralEvolutionChart = () => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchReferralHistory();
    }
  }, [user, period]);

  const fetchReferralHistory = async () => {
    if (!user) return;

    try {
      // Get user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      }

      // Fetch referrals
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('created_at, status, reward_credits')
        .eq('referrer_id', profile.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching referral history:', error);
        setLoading(false);
        return;
      }

      // Group by date
      const dateMap = new Map<string, { referrals: number; credits: number }>();
      
      // Initialize all dates in range
      const dayCount = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      for (let i = dayCount - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        dateMap.set(dateStr, { referrals: 0, credits: 0 });
      }

      // Fill in actual data
      referrals?.forEach(ref => {
        const dateStr = new Date(ref.created_at).toISOString().split('T')[0];
        const existing = dateMap.get(dateStr) || { referrals: 0, credits: 0 };
        existing.referrals++;
        if (ref.status === 'completed' || ref.status === 'rewarded') {
          existing.credits += ref.reward_credits || 0;
        }
        dateMap.set(dateStr, existing);
      });

      // Convert to chart data with cumulative
      let cumulative = 0;
      const chartData: ChartDataPoint[] = Array.from(dateMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, values]) => {
          cumulative += values.referrals;
          return {
            date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            referrals: values.referrals,
            credits: values.credits,
            cumulative,
          };
        });

      setData(chartData);
    } catch (error) {
      console.error('Error in fetchReferralHistory:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalReferrals = data.reduce((sum, d) => sum + d.referrals, 0);
  const totalCredits = data.reduce((sum, d) => sum + d.credits, 0);

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="h-5 w-5 text-neon-cyan" />
            Evolução de Indicações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <TrendingUp className="h-5 w-5 text-neon-cyan" />
          Evolução de Indicações
        </CardTitle>
        <Select value={period} onValueChange={(v: '7d' | '30d' | '90d' | 'all') => setPeriod(v)}>
          <SelectTrigger className="w-32">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
            <SelectItem value="90d">90 dias</SelectItem>
            <SelectItem value="all">1 ano</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="text-xs text-muted-foreground">Período</div>
            <div className="text-xl font-bold text-foreground">{totalReferrals}</div>
            <div className="text-xs text-muted-foreground">indicações</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="text-xs text-muted-foreground">Créditos</div>
            <div className="text-xl font-bold text-neon-cyan">+{totalCredits}</div>
            <div className="text-xs text-muted-foreground">ganhos</div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          {totalReferrals === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma indicação no período</p>
                <p className="text-sm opacity-70">Compartilhe seu código para começar!</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorReferrals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      referrals: 'Novas indicações',
                      cumulative: 'Total acumulado',
                      credits: 'Créditos',
                    };
                    return [value, labels[name] || name];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReferrals)"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="referrals"
                  stroke="hsl(180 100% 50%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(180 100% 50%)', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
