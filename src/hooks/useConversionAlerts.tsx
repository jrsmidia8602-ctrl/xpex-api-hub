import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RECOMMENDED_CONVERSIONS } from "@/lib/analytics";

export interface ConversionThreshold {
  eventName: string;
  minRate: number;
  minCount: number;
  period: "hour" | "day" | "week";
  enabled: boolean;
}

export interface ConversionMetric {
  eventName: string;
  count: number;
  rate: number;
  trend: "up" | "down" | "stable";
  lastTriggered?: string;
}

export interface ConversionAlert {
  id: string;
  eventName: string;
  type: "rate_low" | "count_low" | "no_events";
  message: string;
  threshold: number;
  currentValue: number;
  severity: "warning" | "critical";
  createdAt: string;
  acknowledged: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  type: "email" | "slack";
  recipient: string;
  onlyCritical: boolean;
}

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

const DEFAULT_THRESHOLDS: ConversionThreshold[] = [
  { eventName: "signup_completed", minRate: 5, minCount: 10, period: "day", enabled: true },
  { eventName: "api_key_generated", minRate: 20, minCount: 5, period: "day", enabled: true },
  { eventName: "checkout_started", minRate: 3, minCount: 5, period: "day", enabled: true },
  { eventName: "purchase_completed", minRate: 1, minCount: 2, period: "day", enabled: true },
];

const STORAGE_KEY = "xpex_conversion_thresholds";
const ALERTS_KEY = "xpex_conversion_alerts";
const METRICS_KEY = "xpex_conversion_metrics";
const NOTIFICATION_KEY = "xpex_alert_notifications";
const NOTIFICATION_HISTORY_KEY = "xpex_notification_history";

export const useConversionAlerts = () => {
  const [thresholds, setThresholds] = useState<ConversionThreshold[]>([]);
  const [alerts, setAlerts] = useState<ConversionAlert[]>([]);
  const [metrics, setMetrics] = useState<ConversionMetric[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: false,
    type: "email",
    recipient: "",
    onlyCritical: true,
  });
  const [notificationHistory, setNotificationHistory] = useState<NotificationRecord[]>([]);

  // Load notification settings
  useEffect(() => {
    const stored = localStorage.getItem(NOTIFICATION_KEY);
    if (stored) {
      try {
        setNotificationSettings(JSON.parse(stored));
      } catch {}
    }
    
    const storedHistory = localStorage.getItem(NOTIFICATION_HISTORY_KEY);
    if (storedHistory) {
      try {
        setNotificationHistory(JSON.parse(storedHistory));
      } catch {}
    }
  }, []);

  const saveNotificationSettings = useCallback((settings: NotificationSettings) => {
    setNotificationSettings(settings);
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(settings));
  }, []);

  const addNotificationRecord = useCallback((record: Omit<NotificationRecord, "id">) => {
    const newRecord: NotificationRecord = {
      ...record,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setNotificationHistory(prev => {
      const updated = [newRecord, ...prev].slice(0, 100);
      localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
    return newRecord;
  }, []);

  const updateNotificationRecord = useCallback((id: string, updates: Partial<NotificationRecord>) => {
    setNotificationHistory(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearNotificationHistory = useCallback(() => {
    setNotificationHistory([]);
    localStorage.removeItem(NOTIFICATION_HISTORY_KEY);
  }, []);

  const sendNotification = useCallback(async (alert: ConversionAlert) => {
    if (!notificationSettings.enabled || !notificationSettings.recipient) return;
    if (notificationSettings.onlyCritical && alert.severity !== "critical") return;

    const record = addNotificationRecord({
      type: notificationSettings.type,
      recipient: notificationSettings.recipient,
      alertMessage: alert.message,
      severity: alert.severity,
      status: "pending",
      sentAt: new Date().toISOString(),
    });

    try {
      const response = await supabase.functions.invoke("send-conversion-alert", {
        body: {
          type: notificationSettings.type,
          recipient: notificationSettings.recipient,
          alert: {
            eventName: alert.eventName,
            message: alert.message,
            severity: alert.severity,
            currentValue: alert.currentValue,
            threshold: alert.threshold,
            createdAt: alert.createdAt,
          },
        },
      });

      if (response.error) {
        updateNotificationRecord(record.id, {
          status: "failed",
          errorMessage: response.error.message,
        });
      } else {
        updateNotificationRecord(record.id, {
          status: "sent",
          deliveredAt: new Date().toISOString(),
        });
      }
      console.log("Alert notification sent:", alert.eventName);
    } catch (error: any) {
      updateNotificationRecord(record.id, {
        status: "failed",
        errorMessage: error.message || "Erro desconhecido",
      });
      console.error("Failed to send notification:", error);
    }
  }, [notificationSettings, addNotificationRecord, updateNotificationRecord]);

  // Load thresholds from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setThresholds(JSON.parse(stored));
      } catch {
        setThresholds(DEFAULT_THRESHOLDS);
      }
    } else {
      setThresholds(DEFAULT_THRESHOLDS);
    }

    const storedAlerts = localStorage.getItem(ALERTS_KEY);
    if (storedAlerts) {
      try {
        setAlerts(JSON.parse(storedAlerts));
      } catch {
        setAlerts([]);
      }
    }
  }, []);

  // Save thresholds to localStorage
  const saveThresholds = useCallback((newThresholds: ConversionThreshold[]) => {
    setThresholds(newThresholds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newThresholds));
  }, []);

  // Save alerts to localStorage
  const saveAlerts = useCallback((newAlerts: ConversionAlert[]) => {
    setAlerts(newAlerts);
    localStorage.setItem(ALERTS_KEY, JSON.stringify(newAlerts));
  }, []);

  // Update a single threshold
  const updateThreshold = useCallback((eventName: string, updates: Partial<ConversionThreshold>) => {
    const newThresholds = thresholds.map(t => 
      t.eventName === eventName ? { ...t, ...updates } : t
    );
    saveThresholds(newThresholds);
  }, [thresholds, saveThresholds]);

  // Add new threshold
  const addThreshold = useCallback((threshold: ConversionThreshold) => {
    const existing = thresholds.find(t => t.eventName === threshold.eventName);
    if (!existing) {
      saveThresholds([...thresholds, threshold]);
    }
  }, [thresholds, saveThresholds]);

  // Remove threshold
  const removeThreshold = useCallback((eventName: string) => {
    saveThresholds(thresholds.filter(t => t.eventName !== eventName));
  }, [thresholds, saveThresholds]);

  // Calculate metrics from stored events
  const calculateMetrics = useCallback(() => {
    const eventsRaw = localStorage.getItem("xpex_analytics");
    if (!eventsRaw) return [];

    try {
      const events = JSON.parse(eventsRaw);
      const now = new Date();
      
      const metricsMap = new Map<string, { count: number; previousCount: number }>();
      
      // Initialize metrics for recommended conversions
      RECOMMENDED_CONVERSIONS.forEach(event => {
        metricsMap.set(event, { count: 0, previousCount: 0 });
      });

      // Count events for each period
      events.forEach((event: any) => {
        const eventTime = new Date(event.properties?.timestamp || event.timestamp);
        const hoursDiff = (now.getTime() - eventTime.getTime()) / (1000 * 60 * 60);
        
        if (metricsMap.has(event.name)) {
          const current = metricsMap.get(event.name)!;
          if (hoursDiff <= 24) {
            current.count++;
          } else if (hoursDiff <= 48) {
            current.previousCount++;
          }
          metricsMap.set(event.name, current);
        }
      });

      // Calculate rates and trends
      const totalEvents = events.filter((e: any) => {
        const eventTime = new Date(e.properties?.timestamp || e.timestamp);
        const hoursDiff = (now.getTime() - eventTime.getTime()) / (1000 * 60 * 60);
        return hoursDiff <= 24;
      }).length;

      const calculatedMetrics: ConversionMetric[] = [];
      
      metricsMap.forEach((data, eventName) => {
        const rate = totalEvents > 0 ? (data.count / totalEvents) * 100 : 0;
        let trend: "up" | "down" | "stable" = "stable";
        
        if (data.previousCount > 0) {
          const changePercent = ((data.count - data.previousCount) / data.previousCount) * 100;
          if (changePercent > 10) trend = "up";
          else if (changePercent < -10) trend = "down";
        }

        calculatedMetrics.push({
          eventName,
          count: data.count,
          rate: Math.round(rate * 100) / 100,
          trend,
        });
      });

      setMetrics(calculatedMetrics);
      localStorage.setItem(METRICS_KEY, JSON.stringify(calculatedMetrics));
      
      return calculatedMetrics;
    } catch {
      return [];
    }
  }, []);

  // Check thresholds and generate alerts
  const checkThresholds = useCallback(() => {
    const currentMetrics = calculateMetrics();
    const newAlerts: ConversionAlert[] = [];
    const now = new Date().toISOString();

    thresholds.forEach(threshold => {
      if (!threshold.enabled) return;

      const metric = currentMetrics.find(m => m.eventName === threshold.eventName);
      if (!metric) return;

      // Check rate threshold
      if (metric.rate < threshold.minRate && metric.count > 0) {
        const severity = metric.rate < threshold.minRate / 2 ? "critical" : "warning";
        newAlerts.push({
          id: `${threshold.eventName}-rate-${Date.now()}`,
          eventName: threshold.eventName,
          type: "rate_low",
          message: `Taxa de ${threshold.eventName.replace(/_/g, " ")} está em ${metric.rate.toFixed(1)}% (mínimo: ${threshold.minRate}%)`,
          threshold: threshold.minRate,
          currentValue: metric.rate,
          severity,
          createdAt: now,
          acknowledged: false,
        });
      }

      // Check count threshold
      if (metric.count < threshold.minCount) {
        const severity = metric.count === 0 ? "critical" : "warning";
        newAlerts.push({
          id: `${threshold.eventName}-count-${Date.now()}`,
          eventName: threshold.eventName,
          type: metric.count === 0 ? "no_events" : "count_low",
          message: metric.count === 0 
            ? `Nenhum evento ${threshold.eventName.replace(/_/g, " ")} nas últimas 24h`
            : `Apenas ${metric.count} eventos ${threshold.eventName.replace(/_/g, " ")} (mínimo: ${threshold.minCount})`,
          threshold: threshold.minCount,
          currentValue: metric.count,
          severity,
          createdAt: now,
          acknowledged: false,
        });
      }
    });

    // Only add new alerts that don't already exist
    const existingIds = alerts.map(a => `${a.eventName}-${a.type}`);
    const uniqueNewAlerts = newAlerts.filter(a => 
      !existingIds.includes(`${a.eventName}-${a.type}`)
    );

    if (uniqueNewAlerts.length > 0) {
      const updatedAlerts = [...uniqueNewAlerts, ...alerts].slice(0, 50);
      saveAlerts(updatedAlerts);

      // Show toast for critical alerts
      uniqueNewAlerts
        .filter(a => a.severity === "critical")
        .forEach(alert => {
          toast({
            title: "Alerta de Conversão",
            description: alert.message,
            variant: "destructive",
          });
        });
    }

    return newAlerts;
  }, [thresholds, alerts, calculateMetrics, saveAlerts]);

  // Acknowledge an alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    const updatedAlerts = alerts.map(a => 
      a.id === alertId ? { ...a, acknowledged: true } : a
    );
    saveAlerts(updatedAlerts);
  }, [alerts, saveAlerts]);

  // Dismiss an alert
  const dismissAlert = useCallback((alertId: string) => {
    saveAlerts(alerts.filter(a => a.id !== alertId));
  }, [alerts, saveAlerts]);

  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    saveAlerts([]);
  }, [saveAlerts]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    checkThresholds();
  }, [checkThresholds]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Auto-check thresholds periodically
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      checkThresholds();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isMonitoring, checkThresholds]);

  // Initial check
  useEffect(() => {
    if (thresholds.length > 0) {
      calculateMetrics();
    }
  }, [thresholds, calculateMetrics]);

  return {
    thresholds,
    alerts,
    metrics,
    isMonitoring,
    notificationSettings,
    notificationHistory,
    updateThreshold,
    addThreshold,
    removeThreshold,
    checkThresholds,
    acknowledgeAlert,
    dismissAlert,
    clearAllAlerts,
    startMonitoring,
    stopMonitoring,
    resetToDefaults: () => saveThresholds(DEFAULT_THRESHOLDS),
    saveNotificationSettings,
    sendNotification,
    clearNotificationHistory,
  };
};
