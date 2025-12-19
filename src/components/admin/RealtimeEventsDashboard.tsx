import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart3, 
  RefreshCw, 
  Trash2, 
  Activity, 
  MousePointer2, 
  FileText, 
  UserPlus, 
  CreditCard,
  Key,
  Eye,
  Clock,
  TrendingUp
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface TrackedEvent {
  name: string;
  properties: {
    timestamp: string;
    url?: string;
    page_path?: string;
    cta_id?: string;
    cta_label?: string;
    form_id?: string;
    form_type?: string;
    success?: boolean;
    [key: string]: any;
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  navigation: "hsl(var(--chart-1))",
  engagement: "hsl(var(--chart-2))",
  conversion: "hsl(var(--chart-3))",
  onboarding: "hsl(var(--chart-4))",
  auth: "hsl(var(--chart-5))",
  product: "hsl(var(--primary))",
  api: "hsl(var(--accent-foreground))",
  billing: "hsl(var(--secondary))",
};

const EVENT_ICONS: Record<string, typeof Activity> = {
  page_view: Eye,
  cta_click: MousePointer2,
  form_submitted: FileText,
  form_started: FileText,
  signup_started: UserPlus,
  signup_completed: UserPlus,
  login_completed: UserPlus,
  checkout_started: CreditCard,
  purchase_completed: CreditCard,
  api_key_generated: Key,
  api_playground_used: Activity,
  marketplace_view: Eye,
  product_page_view: Eye,
};

const getEventCategory = (eventName: string): string => {
  const categoryMap: Record<string, string> = {
    page_view: "navigation",
    cta_click: "engagement",
    scroll_depth: "engagement",
    time_on_page: "engagement",
    external_link_click: "engagement",
    navigation_click: "engagement",
    feature_interaction: "engagement",
    search_performed: "engagement",
    form_submitted: "conversion",
    form_started: "conversion",
    signup_started: "onboarding",
    signup_completed: "onboarding",
    login_completed: "auth",
    marketplace_view: "product",
    product_page_view: "product",
    api_playground_used: "api",
    api_key_generated: "api",
    api_key_deleted: "api",
    email_validated: "api",
    checkout_started: "billing",
    checkout_initiated: "billing",
    purchase_completed: "billing",
    credits_purchased: "billing",
    plan_selected: "billing",
  };
  return categoryMap[eventName] || "general";
};

const RealtimeEventsDashboard = () => {
  const [events, setEvents] = useState<TrackedEvent[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadEvents = useCallback(() => {
    try {
      const storedEvents = JSON.parse(localStorage.getItem("xpex_analytics") || "[]");
      setEvents(storedEvents.reverse());
    } catch (e) {
      setEvents([]);
    }
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadEvents();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleClearEvents = () => {
    localStorage.removeItem("xpex_analytics");
    setEvents([]);
  };

  useEffect(() => {
    loadEvents();
    
    if (autoRefresh) {
      const interval = setInterval(loadEvents, 3000);
      return () => clearInterval(interval);
    }
  }, [loadEvents, autoRefresh]);

  // Calculate statistics
  const eventCounts = events.reduce((acc, event) => {
    acc[event.name] = (acc[event.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryCounts = events.reduce((acc, event) => {
    const category = getEventCategory(event.name);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({
      name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
      category: getEventCategory(name),
    }));

  const pieData = Object.entries(categoryCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: CATEGORY_COLORS[name] || "hsl(var(--muted))",
  }));

  // Conversion metrics
  const conversionEvents = ["signup_completed", "api_key_generated", "checkout_started", "purchase_completed"];
  const conversionMetrics = conversionEvents.map((eventName) => ({
    name: eventName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    count: eventCounts[eventName] || 0,
    isRecommended: true,
  }));

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Analytics em Tempo Real
          </h2>
          <p className="text-muted-foreground">Eventos rastreados do localStorage</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "border-primary text-primary" : ""}
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-pulse" : ""}`} />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClearEvents}>
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-sm text-muted-foreground">Total de Eventos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <MousePointer2 className="w-5 h-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">{eventCounts["cta_click"] || 0}</p>
                <p className="text-sm text-muted-foreground">Cliques em CTAs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <FileText className="w-5 h-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">{eventCounts["form_submitted"] || 0}</p>
                <p className="text-sm text-muted-foreground">Forms Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-4/10">
                <TrendingUp className="w-5 h-5 text-chart-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Object.keys(eventCounts).length}</p>
                <p className="text-sm text-muted-foreground">Tipos de Evento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Conversões Recomendadas (GA4)
          </CardTitle>
          <CardDescription>
            Eventos configurados como conversões no GA4
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {conversionMetrics.map((metric) => (
              <div
                key={metric.name}
                className="p-4 rounded-lg border border-border/50 bg-card/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                    Conversão
                  </Badge>
                </div>
                <p className="text-2xl font-bold">{metric.count}</p>
                <p className="text-sm text-muted-foreground">{metric.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Nenhum evento rastreado ainda
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Nenhum evento rastreado ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Eventos Recentes
          </CardTitle>
          <CardDescription>Últimos 50 eventos rastreados em tempo real</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {events.length > 0 ? (
              <div className="space-y-2">
                {events.slice(0, 50).map((event, index) => {
                  const Icon = EVENT_ICONS[event.name] || Activity;
                  const category = getEventCategory(event.name);
                  
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-card/30 hover:bg-card/50 transition-colors"
                    >
                      <div 
                        className="p-2 rounded-lg shrink-0"
                        style={{ backgroundColor: `${CATEGORY_COLORS[category]}20` }}
                      >
                        <Icon 
                          className="w-4 h-4" 
                          style={{ color: CATEGORY_COLORS[category] }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {event.name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {category}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {event.properties.page_path && (
                            <p>Página: {event.properties.page_path}</p>
                          )}
                          {event.properties.cta_label && (
                            <p>CTA: {event.properties.cta_label}</p>
                          )}
                          {event.properties.form_type && (
                            <p>Form: {event.properties.form_type}</p>
                          )}
                          {event.properties.success !== undefined && (
                            <p>Status: {event.properties.success ? "✓ Sucesso" : "✗ Falha"}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatTime(event.properties.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <Activity className="w-12 h-12 mb-4 opacity-50" />
                <p>Nenhum evento rastreado ainda</p>
                <p className="text-sm">Navegue pelo site para ver eventos em tempo real</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeEventsDashboard;
