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
import { Separator } from "@/components/ui/separator";
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
  AlertCircle,
  Mail,
  MessageSquare,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  TestTube2,
} from "lucide-react";
import { useConversionAlerts, ConversionThreshold, NotificationRecord } from "@/hooks/useConversionAlerts";
import { RECOMMENDED_CONVERSIONS } from "@/lib/analytics";
import { toast } from "@/hooks/use-toast";
import { NotificationTest } from "./NotificationTest";

const ConversionAlerts = () => {
  const {
    thresholds,
    alerts,
    metrics,
    isMonitoring,
    notificationSettings,
    notificationHistory,
    updateThreshold,
    addThreshold,
    checkThresholds,
    acknowledgeAlert,
    dismissAlert,
    clearAllAlerts,
    startMonitoring,
    stopMonitoring,
    resetToDefaults,
    saveNotificationSettings,
    clearNotificationHistory,
  } = useConversionAlerts();

  const [newEventName, setNewEventName] = useState("");
  const [editingNotifications, setEditingNotifications] = useState(notificationSettings);

  // Sync local state with hook state
  useEffect(() => {
    setEditingNotifications(notificationSettings);
  }, [notificationSettings]);

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

  const handleSaveNotificationSettings = () => {
    saveNotificationSettings(editingNotifications);
    toast({
      title: "Configurações salvas",
      description: "As configurações de notificação foram atualizadas.",
    });
  };

  const getStatusIcon = (status: NotificationRecord["status"]) => {
    switch (status) {
      case "sent":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />;
    }
  };

  const getStatusBadge = (status: NotificationRecord["status"]) => {
    switch (status) {
      case "sent":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">Enviado</Badge>;
      case "failed":
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="alerts" className="relative">
              Alertas
              {criticalCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {criticalCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
            <TabsTrigger value="notifications">
              <Send className="h-4 w-4 mr-1" />
              Notificações
            </TabsTrigger>
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

          <TabsContent value="notifications" className="mt-4">
            <div className="space-y-6">
              {/* Notification Settings */}
              <div className="space-y-4 p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    <Label className="font-medium">Configurar Notificações</Label>
                  </div>
                  <Switch
                    checked={editingNotifications.enabled}
                    onCheckedChange={(enabled) => 
                      setEditingNotifications(prev => ({ ...prev, enabled }))
                    }
                  />
                </div>

                {editingNotifications.enabled && (
                  <>
                    <Separator />
                    
                    <div className="grid gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Tipo de Notificação</Label>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant={editingNotifications.type === "email" ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => setEditingNotifications(prev => ({ ...prev, type: "email" }))}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </Button>
                          <Button
                            variant={editingNotifications.type === "slack" ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => setEditingNotifications(prev => ({ ...prev, type: "slack" }))}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Slack
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground">
                          {editingNotifications.type === "email" ? "Email do destinatário" : "URL do Webhook Slack"}
                        </Label>
                        <Input
                          type={editingNotifications.type === "email" ? "email" : "url"}
                          placeholder={editingNotifications.type === "email" 
                            ? "admin@empresa.com" 
                            : "https://hooks.slack.com/services/..."}
                          value={editingNotifications.recipient}
                          onChange={(e) => setEditingNotifications(prev => ({ 
                            ...prev, 
                            recipient: e.target.value 
                          }))}
                          className="mt-1"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Apenas alertas críticos</Label>
                          <p className="text-xs text-muted-foreground">
                            Ignora alertas de aviso, notifica apenas críticos
                          </p>
                        </div>
                        <Switch
                          checked={editingNotifications.onlyCritical}
                          onCheckedChange={(onlyCritical) => 
                            setEditingNotifications(prev => ({ ...prev, onlyCritical }))
                          }
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={handleSaveNotificationSettings} 
                      className="w-full"
                      disabled={!editingNotifications.recipient}
                    >
                      Salvar Configurações
                    </Button>
                  </>
                )}
              </div>

              {/* Notification History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    <Label className="font-medium">Histórico de Notificações</Label>
                  </div>
                  {notificationHistory.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearNotificationHistory}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>

                {notificationHistory.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border rounded-lg">
                    <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma notificação enviada</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2 pr-4">
                      {notificationHistory.map((record) => (
                        <div
                          key={record.id}
                          className="p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              {record.type === "email" ? (
                                <Mail className="h-4 w-4 text-primary mt-0.5" />
                              ) : (
                                <MessageSquare className="h-4 w-4 text-[#4A154B] mt-0.5" />
                              )}
                              <div>
                                <p className="text-sm line-clamp-1">{record.alertMessage}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <span>{record.recipient}</span>
                                  <span>•</span>
                                  <span>{formatTimestamp(record.sentAt)}</span>
                                </div>
                                {record.errorMessage && (
                                  <p className="text-xs text-destructive mt-1">
                                    {record.errorMessage}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {getStatusIcon(record.status)}
                              {getStatusBadge(record.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* Summary */}
                {notificationHistory.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">
                        {notificationHistory.length}
                      </div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-500">
                        {notificationHistory.filter(h => h.status === "sent").length}
                      </div>
                      <div className="text-xs text-muted-foreground">Enviados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-destructive">
                        {notificationHistory.filter(h => h.status === "failed").length}
                      </div>
                      <div className="text-xs text-muted-foreground">Falharam</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Test Notifications */}
              <NotificationTest notificationSettings={notificationSettings} />
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