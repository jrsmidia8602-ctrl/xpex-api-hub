import { Helmet } from "react-helmet-async";
import { useState } from "react";
import {
  Users,
  Activity,
  DollarSign,
  Key,
  TrendingUp,
  AlertTriangle,
  Server,
  BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const statsData = [
  { label: "Total Users", value: "2,847", change: "+12%", icon: Users },
  { label: "API Calls Today", value: "156,432", change: "+8%", icon: Activity },
  { label: "Revenue (MTD)", value: "$12,450", change: "+23%", icon: DollarSign },
  { label: "Active API Keys", value: "1,234", change: "+5%", icon: Key },
];

const recentActivity = [
  { user: "user@example.com", action: "Created API Key", time: "2 min ago", type: "info" },
  { user: "dev@startup.io", action: "Upgraded to Pro", time: "15 min ago", type: "success" },
  { user: "api@company.com", action: "Rate limit exceeded", time: "1 hour ago", type: "warning" },
  { user: "test@demo.com", action: "New signup", time: "2 hours ago", type: "info" },
];

const systemHealth = [
  { service: "Email Validator API", status: "operational", uptime: "99.99%" },
  { service: "Authentication", status: "operational", uptime: "100%" },
  { service: "Billing System", status: "operational", uptime: "99.95%" },
  { service: "AI Insights", status: "degraded", uptime: "98.5%" },
];

const Admin = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Admin Dashboard - XPEX Neural</title>
        <meta name="description" content="XPEX Neural Admin Dashboard - Monitor users, API usage, and system health." />
      </Helmet>

      <Navbar />

      <main className="pt-24 pb-16 container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Monitor and manage XPEX Neural platform</p>
          </div>
          <Badge variant="outline" className="text-primary border-primary">
            Admin Access
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat) => (
            <Card key={stat.label} className="p-6 bg-card/50 backdrop-blur border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-green-500 font-medium">{stat.change}</span>
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card/50 border border-border/50 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div>
                        <div className="text-sm font-medium">{item.action}</div>
                        <div className="text-xs text-muted-foreground">{item.user}</div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            item.type === "success"
                              ? "text-green-500 border-green-500/30"
                              : item.type === "warning"
                              ? "text-yellow-500 border-yellow-500/30"
                              : "text-muted-foreground"
                          }
                        >
                          {item.time}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* System Health */}
              <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" />
                  System Health
                </h3>
                <div className="space-y-4">
                  {systemHealth.map((item) => (
                    <div key={item.service} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            item.status === "operational" ? "bg-green-500" : "bg-yellow-500"
                          }`}
                        />
                        <span className="text-sm">{item.service}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.uptime}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
                <Button variant="outline" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
                <Button variant="outline" size="sm">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  View Alerts
                </Button>
                <Button variant="outline" size="sm">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Revenue Details
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
              <p className="text-muted-foreground">User management interface coming soon...</p>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
              <p className="text-muted-foreground">Advanced analytics coming soon...</p>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
              <p className="text-muted-foreground">System configuration coming soon...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
