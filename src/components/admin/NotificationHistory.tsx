import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  MessageSquare,
  Trash2,
  RefreshCw,
} from "lucide-react";

export interface NotificationRecord {
  id: string;
  type: "email" | "slack";
  recipient: string;
  alertMessage: string;
  severity: "warning" | "critical";
  status: "pending" | "sent" | "failed";
  sentAt: string;
  deliveredAt?: string;
  errorMessage?: string;
}

const HISTORY_KEY = "xpex_notification_history";

export const useNotificationHistory = () => {
  const [history, setHistory] = useState<NotificationRecord[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  const addRecord = (record: Omit<NotificationRecord, "id">) => {
    const newRecord: NotificationRecord = {
      ...record,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    const updated = [newRecord, ...history].slice(0, 100);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return newRecord;
  };

  const updateRecord = (id: string, updates: Partial<NotificationRecord>) => {
    const updated = history.map(r => 
      r.id === id ? { ...r, ...updates } : r
    );
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  return { history, addRecord, updateRecord, clearHistory };
};

interface NotificationHistoryProps {
  history: NotificationRecord[];
  onClear: () => void;
}

export const NotificationHistory = ({ history, onClear }: NotificationHistoryProps) => {
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

  const getTypeIcon = (type: "email" | "slack") => {
    return type === "email" ? (
      <Mail className="h-4 w-4 text-primary" />
    ) : (
      <MessageSquare className="h-4 w-4 text-[#4A154B]" />
    );
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Notificações
            </CardTitle>
            <CardDescription>
              Registro de alertas enviados por email/Slack
            </CardDescription>
          </div>
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma notificação enviada</p>
            <p className="text-sm">O histórico aparecerá aqui quando alertas forem disparados</p>
          </div>
        ) : (
          <ScrollArea className="h-[350px]">
            <div className="space-y-3 pr-4">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getTypeIcon(record.type)}</div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium line-clamp-2">
                          {record.alertMessage}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{record.recipient}</span>
                          <span>•</span>
                          <span>{formatTimestamp(record.sentAt)}</span>
                        </div>
                        {record.errorMessage && (
                          <p className="text-xs text-destructive mt-1">
                            Erro: {record.errorMessage}
                          </p>
                        )}
                        {record.deliveredAt && (
                          <p className="text-xs text-green-500 mt-1">
                            Entregue em {formatTimestamp(record.deliveredAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusIcon(record.status)}
                      {getStatusBadge(record.status)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      variant={record.severity === "critical" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {record.severity === "critical" ? "Crítico" : "Aviso"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Summary stats */}
        {history.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">
                {history.length}
              </div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-500">
                {history.filter(h => h.status === "sent").length}
              </div>
              <div className="text-xs text-muted-foreground">Enviados</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-destructive">
                {history.filter(h => h.status === "failed").length}
              </div>
              <div className="text-xs text-muted-foreground">Falharam</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
