import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Clock,
  TrendingUp,
  Server,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "outage";
  uptime: number;
  responseTime: number;
  lastChecked: Date;
}

const Status = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: "Gold Email Validator API",
      status: "operational",
      uptime: 99.98,
      responseTime: 45,
      lastChecked: new Date(),
    },
    {
      name: "AI Insights Engine",
      status: "operational",
      uptime: 99.95,
      responseTime: 120,
      lastChecked: new Date(),
    },
    {
      name: "Authentication Service",
      status: "operational",
      uptime: 99.99,
      responseTime: 32,
      lastChecked: new Date(),
    },
    {
      name: "Dashboard & Analytics",
      status: "operational",
      uptime: 99.97,
      responseTime: 85,
      lastChecked: new Date(),
    },
    {
      name: "Webhook Delivery",
      status: "operational",
      uptime: 99.92,
      responseTime: 150,
      lastChecked: new Date(),
    },
  ]);

  const [overallUptime, setOverallUptime] = useState(99.96);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setServices((prev) =>
        prev.map((service) => ({
          ...service,
          responseTime: Math.max(
            20,
            service.responseTime + Math.floor(Math.random() * 20) - 10
          ),
          lastChecked: new Date(),
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "operational":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "outage":
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "operational":
        return "Operational";
      case "degraded":
        return "Degraded Performance";
      case "outage":
        return "Service Outage";
    }
  };

  const getStatusColor = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "operational":
        return "text-green-500";
      case "degraded":
        return "text-yellow-500";
      case "outage":
        return "text-red-500";
    }
  };

  const allOperational = services.every((s) => s.status === "operational");

  return (
    <>
      <Helmet>
        <title>System Status - XPEX Neural</title>
        <meta
          name="description"
          content="Real-time status and uptime metrics for all XPEX Neural API services."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Overall Status */}
          <div className="text-center mb-12">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
                allOperational
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-yellow-500/10 border border-yellow-500/20"
              }`}
            >
              {allOperational ? (
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-yellow-500" />
              )}
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {allOperational ? "All Systems Operational" : "Partial Outage"}
            </h1>
            <p className="text-muted-foreground text-lg">
              Current system status and real-time performance metrics
            </p>
          </div>

          {/* Uptime Overview */}
          <div className="grid gap-6 md:grid-cols-3 mb-12">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground text-sm">
                  30-Day Uptime
                </span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {overallUptime}%
              </p>
              <Progress value={overallUptime} className="mt-3 h-2" />
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground text-sm">
                  Avg Response Time
                </span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {Math.round(
                  services.reduce((acc, s) => acc + s.responseTime, 0) /
                    services.length
                )}
                ms
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Last 24 hours
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Server className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground text-sm">
                  Active Services
                </span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {services.filter((s) => s.status === "operational").length}/
                {services.length}
              </p>
              <p className="text-sm text-green-500 mt-2">All healthy</p>
            </div>
          </div>

          {/* Service List */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Service Status
              </h2>
            </div>

            <div className="divide-y divide-border/50">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="p-6 flex items-center justify-between hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(service.status)}
                    <div>
                      <h3 className="font-medium text-foreground">
                        {service.name}
                      </h3>
                      <p
                        className={`text-sm ${getStatusColor(service.status)}`}
                      >
                        {getStatusText(service.status)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 text-sm">
                    <div className="text-right">
                      <p className="text-muted-foreground">Uptime</p>
                      <p className="font-medium text-foreground">
                        {service.uptime}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Response</p>
                      <p className="font-medium text-foreground">
                        {service.responseTime}ms
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Last Updated */}
          <p className="text-center text-muted-foreground text-sm mt-8">
            Last updated: {new Date().toLocaleString()} • Auto-refreshes every 5
            seconds
          </p>
        </main>
      </div>
    </>
  );
};

export default Status;
