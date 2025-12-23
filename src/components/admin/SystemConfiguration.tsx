import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Server,
  Database,
  Shield,
  Bell,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  latency?: number;
  lastCheck: string;
}

export function SystemConfiguration() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    autoBackup: true,
    rateLimitEnabled: true,
    webhookRetries: true,
  });

  const checkServices = async () => {
    setLoading(true);
    const results: ServiceStatus[] = [];

    // Check Database
    const dbStart = Date.now();
    try {
      const { error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .limit(1);
      
      results.push({
        name: "Database",
        status: error ? "degraded" : "operational",
        latency: Date.now() - dbStart,
        lastCheck: new Date().toISOString(),
      });
    } catch {
      results.push({
        name: "Database",
        status: "down",
        lastCheck: new Date().toISOString(),
      });
    }

    // Check Edge Functions (Health endpoint)
    const efStart = Date.now();
    try {
      const { error } = await supabase.functions.invoke("health", {
        method: "GET",
      });
      
      results.push({
        name: "Edge Functions",
        status: error ? "degraded" : "operational",
        latency: Date.now() - efStart,
        lastCheck: new Date().toISOString(),
      });
    } catch {
      results.push({
        name: "Edge Functions",
        status: "down",
        lastCheck: new Date().toISOString(),
      });
    }

    // Check Auth
    const authStart = Date.now();
    try {
      const { error } = await supabase.auth.getSession();
      results.push({
        name: "Authentication",
        status: error ? "degraded" : "operational",
        latency: Date.now() - authStart,
        lastCheck: new Date().toISOString(),
      });
    } catch {
      results.push({
        name: "Authentication",
        status: "down",
        lastCheck: new Date().toISOString(),
      });
    }

    // Add static services
    results.push({
      name: "Rate Limiter",
      status: settings.rateLimitEnabled ? "operational" : "degraded",
      lastCheck: new Date().toISOString(),
    });

    results.push({
      name: "Webhooks",
      status: "operational",
      lastCheck: new Date().toISOString(),
    });

    setServices(results);
    setLoading(false);
  };

  useEffect(() => {
    checkServices();
    const interval = setInterval(checkServices, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      operational: "bg-green-500/10 text-green-500 border-green-500/30",
      degraded: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
      down: "bg-red-500/10 text-red-500 border-red-500/30",
    };
    return colors[status as keyof typeof colors] || colors.down;
  };

  const handleSettingChange = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success(`Setting updated: ${key}`);
  };

  return (
    <div className="space-y-6">
      {/* Service Status */}
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Service Status</h3>
          </div>
          <Button variant="outline" size="sm" onClick={checkServices} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Check Status
          </Button>
        </div>

        <div className="grid gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            ))
          ) : (
            services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-4 rounded-lg border border-border/50"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <span className="font-medium">{service.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  {service.latency && (
                    <span className="text-sm text-muted-foreground">
                      {service.latency}ms
                    </span>
                  )}
                  <Badge variant="outline" className={getStatusBadge(service.status)}>
                    {service.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* System Settings */}
      <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-bold">System Settings</h3>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable to show maintenance page to users
              </p>
            </div>
            <Switch
              id="maintenance"
              checked={settings.maintenanceMode}
              onCheckedChange={() => handleSettingChange("maintenanceMode")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="backup">Automatic Backups</Label>
              <p className="text-sm text-muted-foreground">
                Weekly backup of configurations and data
              </p>
            </div>
            <Switch
              id="backup"
              checked={settings.autoBackup}
              onCheckedChange={() => handleSettingChange("autoBackup")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ratelimit">Rate Limiting</Label>
              <p className="text-sm text-muted-foreground">
                Enable API rate limiting per key and IP
              </p>
            </div>
            <Switch
              id="ratelimit"
              checked={settings.rateLimitEnabled}
              onCheckedChange={() => handleSettingChange("rateLimitEnabled")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="webhooks">Webhook Retries</Label>
              <p className="text-sm text-muted-foreground">
                Automatically retry failed webhook deliveries
              </p>
            </div>
            <Switch
              id="webhooks"
              checked={settings.webhookRetries}
              onCheckedChange={() => handleSettingChange("webhookRetries")}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
