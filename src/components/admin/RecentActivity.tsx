import { Activity, CheckCircle, XCircle, Clock } from "lucide-react";

interface ActivityItem {
  id: string;
  endpoint: string;
  status: "success" | "error" | "pending";
  timestamp: string;
  duration: string;
  ip: string;
}

const activities: ActivityItem[] = [
  {
    id: "1",
    endpoint: "POST /api/validate",
    status: "success",
    timestamp: "12:45:32",
    duration: "45ms",
    ip: "192.168.1.***",
  },
  {
    id: "2",
    endpoint: "POST /api/validate",
    status: "success",
    timestamp: "12:44:18",
    duration: "52ms",
    ip: "10.0.0.***",
  },
  {
    id: "3",
    endpoint: "GET /api/health",
    status: "success",
    timestamp: "12:43:55",
    duration: "12ms",
    ip: "172.16.0.***",
  },
  {
    id: "4",
    endpoint: "POST /api/validate",
    status: "error",
    timestamp: "12:42:10",
    duration: "102ms",
    ip: "192.168.2.***",
  },
  {
    id: "5",
    endpoint: "POST /api/validate",
    status: "success",
    timestamp: "12:41:45",
    duration: "38ms",
    ip: "10.0.1.***",
  },
  {
    id: "6",
    endpoint: "GET /api/stats",
    status: "pending",
    timestamp: "12:40:22",
    duration: "-",
    ip: "192.168.1.***",
  },
];

const StatusIcon = ({ status }: { status: ActivityItem["status"] }) => {
  switch (status) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    case "error":
      return <XCircle className="h-4 w-4 text-red-400" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-400" />;
  }
};

export const RecentActivity = () => {
  return (
    <div className="glass-card p-6 rounded-xl border border-border/50">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-5 w-5 text-neon-cyan" />
        <h3 className="text-lg font-display font-semibold text-foreground">
          Atividade Recente
        </h3>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <StatusIcon status={activity.status} />
              <div>
                <p className="text-sm font-mono text-foreground">{activity.endpoint}</p>
                <p className="text-xs text-muted-foreground">{activity.ip}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono text-muted-foreground">{activity.timestamp}</p>
              <p className="text-xs text-neon-cyan">{activity.duration}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
