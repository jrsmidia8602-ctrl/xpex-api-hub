import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  Bell, 
  BellOff, 
  Check, 
  Settings, 
  TrendingDown, 
  TrendingUp, 
  Minus,
  Trash2,
  RefreshCw,
  Play,
  Pause,
  AlertCircle
} from "lucide-react";
import { useConversionAlerts, ConversionThreshold } from "@/hooks/useConversionAlerts";
import { RECOMMENDED_CONVERSIONS } from "@/lib/analytics";

const ConversionAlerts = () => {
  const {
    thresholds,
    alerts,
    metrics,
    isMonitoring,
    updateThreshold,
    addThreshold,
    checkThresholds,
    acknowledgeAlert,
    dismissAlert,
    clearAllAlerts,
    startMonitoring,
    stopMonitoring,
    resetToDefaults,
  } = useConversionAlerts();

  const [newEventName, setNewEventName] = useState("");

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;
  const criticalCount = alerts.filter(a => a.severity === "critical" && !a.acknowledged).length;

  const formatEventName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down": return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleAddThreshold = () => {
    if (newEventName && !thresholds.find(t => t.eventName === newEventName)) {
      addThreshold({
        eventName: newEventName,
        minRate: 5,
        minCount: 5,
        period: "day",
        enabled: true,
      });
      setNewEventName("");
    }
  };

  // Auto-start monitoring on mount
  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas de Conversão
              {unacknowledgedCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unacknowledgedCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Monitoramento automático de métricas de conversão
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkThresholds}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Verificar
            </Button>
            <Button
              variant={isMonitoring ? "secondary" : "default"}
              size="sm"
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
            >
              {isMonitoring ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Iniciar
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="alerts">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="alerts" className="relative">
              Alertas
              {criticalCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {criticalCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-1" />
              Configurar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="mt-4">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BellOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum alerta ativo</p>
                <p className="text-sm">Todas as métricas estão dentro dos limites</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-end mb-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAllAlerts}
                    className="text-muted-foreground"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Limpar todos
                  </Button>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 pr-4">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-lg border ${
                          alert.severity === "critical"
                            ? "border-destructive/50 bg-destructive/5"
                            : "border-yellow-500/50 bg-yellow-500/5"
                        } ${alert.acknowledged ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            {alert.severity === "critical" ? (
                              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="text-sm font-medium">{alert.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(alert.createdAt).toLocaleString("pt-BR")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!alert.acknowledged && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => acknowledgeAlert(alert.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => dismissAlert(alert.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="mt-4">
            <div className="grid gap-3">
              {metrics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma métrica disponível</p>
                  <p className="text-sm">Aguarde eventos serem registrados</p>
                </div>
              ) : (
                metrics.map((metric) => {
                  const threshold = thresholds.find(t => t.eventName === metric.eventName);
                  const isRateBelowThreshold = threshold && metric.rate < threshold.minRate;
                  const isCountBelowThreshold = threshold && metric.count < threshold.minCount;

                  return (
                    <div
                      key={metric.eventName}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        {getTrendIcon(metric.trend)}
                        <div>
                          <p className="font-medium text-sm">
                            {formatEventName(metric.eventName)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={isCountBelowThreshold ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {metric.count} eventos
                            </Badge>
                            <Badge 
                              variant={isRateBelowThreshold ? "destructive" : "outline"}
                              className="text-xs"
                            >
                              {metric.rate.toFixed(1)}% taxa
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {threshold && (
                        <div className="text-right text-xs text-muted-foreground">
                          <p>Min: {threshold.minCount} eventos</p>
                          <p>Min: {threshold.minRate}% taxa</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Configure limites mínimos para cada evento de conversão
                </p>
                <Button variant="ghost" size="sm" onClick={resetToDefaults}>
                  Restaurar padrões
                </Button>
              </div>

              <ScrollArea className="h-[280px]">
                <div className="space-y-4 pr-4">
                  {thresholds.map((threshold) => (
                    <div
                      key={threshold.eventName}
                      className="p-4 rounded-lg border bg-card space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">
                          {formatEventName(threshold.eventName)}
                        </Label>
                        <Switch
                          checked={threshold.enabled}
                          onCheckedChange={(enabled) => 
                            updateThreshold(threshold.eventName, { enabled })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Taxa mínima (%)
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={threshold.minRate}
                            onChange={(e) => 
                              updateThreshold(threshold.eventName, { 
                                minRate: parseFloat(e.target.value) || 0 
                              })
                            }
                            className="h-8 mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Contagem mínima
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={threshold.minCount}
                            onChange={(e) => 
                              updateThreshold(threshold.eventName, { 
                                minCount: parseInt(e.target.value) || 0 
                              })
                            }
                            className="h-8 mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Período
                          </Label>
                          <Select
                            value={threshold.period}
                            onValueChange={(period: "hour" | "day" | "week") => 
                              updateThreshold(threshold.eventName, { period })
                            }
                          >
                            <SelectTrigger className="h-8 mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hour">Hora</SelectItem>
                              <SelectItem value="day">Dia</SelectItem>
                              <SelectItem value="week">Semana</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Add new threshold */}
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium">Adicionar novo evento</Label>
                <div className="flex gap-2 mt-2">
                  <Select value={newEventName} onValueChange={setNewEventName}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {RECOMMENDED_CONVERSIONS.filter(
                        e => !thresholds.find(t => t.eventName === e)
                      ).map(event => (
                        <SelectItem key={event} value={event}>
                          {formatEventName(event)}
                        </SelectItem>
                      ))}
                      <SelectItem value="form_submitted">Form Submitted</SelectItem>
                      <SelectItem value="demo_started">Demo Started</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddThreshold} disabled={!newEventName}>
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ConversionAlerts;
