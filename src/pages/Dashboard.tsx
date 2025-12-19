import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, Key, Users, DollarSign, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/admin/StatsCard";
import { RealtimeUsageChart } from "@/components/admin/RealtimeUsageChart";
import { APIKeysTable } from "@/components/admin/APIKeysTable";
import { RecentActivity } from "@/components/admin/RecentActivity";
import { AIInsights } from "@/components/admin/AIInsights";
import { SubscriptionCard } from "@/components/admin/SubscriptionCard";
import { RateLimitingCard } from "@/components/admin/RateLimitingCard";
import { LiveMetricsPanel } from "@/components/admin/LiveMetricsPanel";
import { LatencyGraph } from "@/components/admin/LatencyGraph";
import { EndpointBreakdown } from "@/components/admin/EndpointBreakdown";
import { ReferralCard } from "@/components/admin/ReferralCard";
import { WebhooksManager } from "@/components/admin/WebhooksManager";
import { useAuth } from "@/hooks/useAuth";
import { useAPIKeys } from "@/hooks/useAPIKeys";
import { useUsageLogs } from "@/hooks/useUsageLogs";
import { useSubscription } from "@/hooks/useSubscription";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { keys } = useAPIKeys();
  const { stats } = useUsageLogs();
  const { subscription } = useSubscription();

  const activeKeys = keys.filter(k => k.status === 'active').length;
  const totalCalls = stats?.totalCalls || keys.reduce((acc, k) => acc + k.calls_count, 0);

  const handleSignOut = async () => {
    await signOut();
  };

  const tierLabels = {
    free: 'Free tier',
    pro: '+12.5% este mês',
    enterprise: '+45.2% este mês'
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-neon-cyan/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-display font-bold text-foreground">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-mono">
              {user?.email}
            </span>
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-red-400"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total de Chamadas"
            value={totalCalls.toLocaleString()}
            change={tierLabels[subscription.tier]}
            changeType={subscription.tier === 'free' ? 'neutral' : 'positive'}
            icon={BarChart3}
          />
          <StatsCard
            title="API Keys Ativas"
            value={activeKeys.toString()}
            change={`${keys.length} total`}
            changeType="neutral"
            icon={Key}
          />
          <StatsCard
            title="Créditos Mensais"
            value={subscription.monthlyCredits === -1 ? '∞' : subscription.monthlyCredits.toLocaleString()}
            change={subscription.tier.toUpperCase()}
            changeType={subscription.tier === 'free' ? 'neutral' : 'positive'}
            icon={Users}
          />
          <StatsCard
            title="Plano Atual"
            value={subscription.tier === 'free' ? '$0' : subscription.tier === 'pro' ? '$29' : '$199'}
            change={subscription.tier === 'free' ? 'Free' : 'Ativo'}
            changeType={subscription.tier === 'free' ? 'neutral' : 'positive'}
            icon={DollarSign}
          />
        </div>

        {/* Live Metrics Panel */}
        <div className="mb-8">
          <LiveMetricsPanel />
        </div>

        {/* Charts and Subscription */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <RealtimeUsageChart />
          </div>
          <div className="space-y-6">
            <SubscriptionCard />
            <RateLimitingCard />
          </div>
        </div>

        {/* Latency and Endpoint Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <LatencyGraph />
          <EndpointBreakdown />
        </div>

        {/* AI Insights and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <AIInsights />
          </div>
          <RecentActivity />
        </div>

        {/* Referral and Webhooks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ReferralCard />
          <WebhooksManager />
        </div>

        {/* API Keys Table */}
        <APIKeysTable />
      </main>
    </div>
  );
};

export default Dashboard;
