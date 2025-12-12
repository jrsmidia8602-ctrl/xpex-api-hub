import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
}

export const StatsCard = ({ title, value, change, changeType, icon: Icon }: StatsCardProps) => {
  return (
    <div className="glass-card p-6 rounded-xl border border-border/50 hover:border-neon-cyan/30 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-mono">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2 font-display">{value}</p>
          <p className={cn(
            "text-sm mt-1 font-mono",
            changeType === "positive" && "text-green-400",
            changeType === "negative" && "text-red-400",
            changeType === "neutral" && "text-muted-foreground"
          )}>
            {change}
          </p>
        </div>
        <div className="h-14 w-14 rounded-xl bg-neon-cyan/10 flex items-center justify-center">
          <Icon className="h-7 w-7 text-neon-cyan" />
        </div>
      </div>
    </div>
  );
};
