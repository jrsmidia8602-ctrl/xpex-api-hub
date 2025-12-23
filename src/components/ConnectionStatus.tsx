import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ConnectionState = "connected" | "reconnecting" | "offline";

export function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionState>("connected");
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    // Check online status
    const handleOnline = () => {
      setStatus("reconnecting");
      checkConnection();
    };

    const handleOffline = () => {
      setStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial connection check
    checkConnection();

    // Periodic health check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  const checkConnection = async () => {
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }

    try {
      setStatus("reconnecting");
      
      // Use a lightweight query to check connection
      const { error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .limit(1);

      if (error) {
        // If it's an auth error, we're still connected but not authenticated
        // This is normal for public pages
        if (error.code === "PGRST301" || error.message.includes("JWT")) {
          setStatus("connected");
        } else {
          setStatus("offline");
        }
      } else {
        setStatus("connected");
      }
      
      setLastCheck(new Date());
    } catch {
      setStatus("offline");
    }
  };

  // Don't show indicator when connected (non-intrusive)
  if (status === "connected") {
    return null;
  }

  const statusConfig = {
    connected: {
      icon: Wifi,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      label: "Connected",
    },
    reconnecting: {
      icon: RefreshCw,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      label: "Reconnecting...",
    },
    offline: {
      icon: WifiOff,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      label: "Offline",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all",
              config.bgColor,
              config.color
            )}
          >
            <Icon
              className={cn(
                "w-3 h-3",
                status === "reconnecting" && "animate-spin"
              )}
            />
            <span className="hidden sm:inline">{config.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
          <p className="text-xs text-muted-foreground">
            Last check: {lastCheck.toLocaleTimeString()}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
