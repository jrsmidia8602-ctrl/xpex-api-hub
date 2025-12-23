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
    <div className="glass-card p-6 rounded-xl border border-border/50 hover:border-neon-cyan/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-neon-cyan/10 cursor-pointer group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-mono">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2 font-display transition-colors duration-300 group-hover:text-primary">{value}</p>
          <p className={cn(
            "text-sm mt-1 font-mono transition-all duration-300",
            changeType === "positive" && "text-green-400",
            changeType === "negative" && "text-red-400",
            changeType === "neutral" && "text-muted-foreground"
          )}>
            {change}
          </p>
        </div>
        <div className="h-14 w-14 rounded-xl bg-neon-cyan/10 flex items-center justify-center transition-all duration-300 group-hover:bg-neon-cyan/20 group-hover:scale-110">
          <Icon className="h-7 w-7 text-neon-cyan transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>
    </div>
  );
};
