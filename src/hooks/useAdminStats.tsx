import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminStats {
  totalUsers: number;
  apiCallsToday: number;
  revenueMTD: number;
  activeApiKeys: number;
  totalUsersChange: number;
  apiCallsChange: number;
  revenueChange: number;
  apiKeysChange: number;
}

interface RecentActivity {
  user: string;
  action: string;
  time: string;
  type: "info" | "success" | "warning";
}

interface SystemHealth {
  service: string;
  status: "operational" | "degraded" | "outage";
  uptime: string;
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    apiCallsToday: 0,
    revenueMTD: 0,
    activeApiKeys: 0,
    totalUsersChange: 0,
    apiCallsChange: 0,
    revenueChange: 0,
    apiKeysChange: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      // Fetch total users count
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch today's API calls
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: apiCallsToday } = await supabase
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      // Fetch yesterday's API calls for comparison
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const { count: apiCallsYesterday } = await supabase
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", yesterday.toISOString())
        .lt("created_at", today.toISOString());

      // Fetch active API keys
      const { count: activeApiKeys } = await supabase
        .from("api_keys")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Fetch last week's users for comparison
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const { count: usersLastWeek } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .lt("created_at", lastWeek.toISOString());

      // Fetch subscriptions for revenue estimation
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("product_id, status")
        .eq("status", "active");

      // Calculate estimated MTD revenue (Pro = $49, Enterprise = $199)
      let revenueMTD = 0;
      if (subscriptions) {
        subscriptions.forEach((sub) => {
          if (sub.product_id === "prod_TauVzfgQFvBrsi") {
            revenueMTD += 199;
          } else if (sub.product_id === "prod_TauJUR0INIl6gz") {
            revenueMTD += 49;
          }
        });
      }

      // Calculate percentage changes
      const apiCallsChange = apiCallsYesterday
        ? Math.round(((apiCallsToday || 0) - apiCallsYesterday) / apiCallsYesterday * 100)
        : 0;
      const totalUsersChange = usersLastWeek
        ? Math.round(((totalUsers || 0) - usersLastWeek) / usersLastWeek * 100)
        : 0;

      setStats({
        totalUsers: totalUsers || 0,
        apiCallsToday: apiCallsToday || 0,
        revenueMTD,
        activeApiKeys: activeApiKeys || 0,
        totalUsersChange,
        apiCallsChange,
        revenueChange: 0, // Would need historical data
        apiKeysChange: 0,
      });

      // Fetch recent audit logs for activity
      const { data: auditLogs } = await supabase
        .from("audit_logs")
        .select("action, resource_type, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(10);

      if (auditLogs) {
        const activities: RecentActivity[] = await Promise.all(
          auditLogs.map(async (log) => {
            // Get user email
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("user_id", log.user_id)
              .single();

            const actionMap: Record<string, { action: string; type: "info" | "success" | "warning" }> = {
              create: { action: "Created", type: "info" },
              update: { action: "Updated", type: "info" },
              delete: { action: "Deleted", type: "warning" },
              subscription_created: { action: "Upgraded to Pro", type: "success" },
              webhook_signature_invalid: { action: "Webhook signature failed", type: "warning" },
            };

            const mappedAction = actionMap[log.action] || { action: log.action, type: "info" as const };

            return {
              user: profile?.email || "Unknown User",
              action: `${mappedAction.action} ${log.resource_type}`,
              time: formatTimeAgo(new Date(log.created_at)),
              type: mappedAction.type,
            };
          })
        );
        setRecentActivity(activities);
      }

      // Fetch system incidents for health status
      const { data: incidents } = await supabase
        .from("system_incidents")
        .select("*")
        .eq("status", "investigating")
        .or("status.eq.identified,status.eq.monitoring");

      const services = [
        { service: "Email Validator API", key: "email-validator" },
        { service: "Authentication", key: "auth" },
        { service: "Billing System", key: "billing" },
        { service: "AI Insights", key: "ai" },
      ];

      const healthStatus: SystemHealth[] = services.map((svc) => {
        const incident = incidents?.find((i) =>
          i.affected_services?.includes(svc.key)
        );
        return {
          service: svc.service,
          status: incident
            ? (incident.severity === "critical" ? "outage" : "degraded")
            : "operational",
          uptime: incident ? "Investigating" : "99.99%",
        };
      });

      setSystemHealth(healthStatus);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, recentActivity, systemHealth, loading, refetch: fetchAdminStats };
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}
