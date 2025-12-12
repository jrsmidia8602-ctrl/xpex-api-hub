import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface APICardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  price: string;
  color: "cyan" | "purple" | "green" | "orange" | "pink";
  featured?: boolean;
}

const colorClasses = {
  cyan: {
    bg: "bg-neon-cyan/10",
    border: "border-neon-cyan/30 hover:border-neon-cyan/60",
    icon: "text-neon-cyan",
    glow: "group-hover:shadow-[0_0_30px_hsl(185_100%_50%/0.3)]",
  },
  purple: {
    bg: "bg-neon-purple/10",
    border: "border-neon-purple/30 hover:border-neon-purple/60",
    icon: "text-neon-purple",
    glow: "group-hover:shadow-[0_0_30px_hsl(280_100%_65%/0.3)]",
  },
  green: {
    bg: "bg-neon-green/10",
    border: "border-neon-green/30 hover:border-neon-green/60",
    icon: "text-neon-green",
    glow: "group-hover:shadow-[0_0_30px_hsl(150_100%_50%/0.3)]",
  },
  orange: {
    bg: "bg-neon-orange/10",
    border: "border-neon-orange/30 hover:border-neon-orange/60",
    icon: "text-neon-orange",
    glow: "group-hover:shadow-[0_0_30px_hsl(25_100%_55%/0.3)]",
  },
  pink: {
    bg: "bg-neon-pink/10",
    border: "border-neon-pink/30 hover:border-neon-pink/60",
    icon: "text-neon-pink",
    glow: "group-hover:shadow-[0_0_30px_hsl(330_100%_65%/0.3)]",
  },
};

const APICard = ({ name, description, icon: Icon, price, color, featured }: APICardProps) => {
  const colors = colorClasses[color];

  return (
    <div
      className={`group relative card-cyber rounded-2xl p-6 transition-all duration-500 ${colors.border} ${colors.glow} ${
        featured ? "md:col-span-2 md:row-span-2" : ""
      }`}
    >
      {featured && (
        <div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
          FLAGSHIP
        </div>
      )}

      <div className={`inline-flex p-3 rounded-xl ${colors.bg} mb-4`}>
        <Icon className={`w-6 h-6 ${colors.icon}`} />
      </div>

      <h3 className={`text-xl font-bold mb-2 ${featured ? "text-2xl" : ""}`}>
        {name}
      </h3>
      
      <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
        {description}
      </p>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
        <span className="text-sm font-mono text-muted-foreground">
          {price}
        </span>
        <Button variant="ghost" size="sm" className="group/btn">
          Try it
          <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
        </Button>
      </div>
    </div>
  );
};

export default APICard;
