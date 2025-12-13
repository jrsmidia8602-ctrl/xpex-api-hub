import { useAPIKeys } from "@/hooks/useAPIKeys";
import { useSubscription } from "@/hooks/useSubscription";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Gauge } from "lucide-react";

export const RateLimitingCard = () => {
  const { keys } = useAPIKeys();
  const { subscription } = useSubscription();

  const totalCalls = keys.reduce((acc, k) => acc + k.calls_count, 0);
  const monthlyLimit = subscription.monthlyCredits === -1 ? Infinity : subscription.monthlyCredits;
  const usagePercentage = monthlyLimit === Infinity ? 0 : (totalCalls / monthlyLimit) * 100;
  
  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-400";
    if (percentage >= 70) return "text-yellow-400";
    return "text-green-400";
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 90) return { label: "Crítico", variant: "destructive" as const };
    if (percentage >= 70) return { label: "Atenção", variant: "secondary" as const };
    return { label: "Normal", variant: "outline" as const };
  };

  const status = getStatusBadge(usagePercentage);

  return (
    <div className="glass-card p-6 rounded-xl border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-display font-semibold text-foreground">
            Rate Limiting
          </h3>
        </div>
        <Badge variant={status.variant} className="font-mono text-xs">
          {status.label}
        </Badge>
      </div>

      {/* Overall Usage */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Uso Mensal Total</span>
          <span className={`text-sm font-mono font-bold ${getStatusColor(usagePercentage)}`}>
            {monthlyLimit === Infinity ? 'Ilimitado' : `${usagePercentage.toFixed(1)}%`}
          </span>
        </div>
        <Progress 
          value={Math.min(usagePercentage, 100)} 
          className="h-3 bg-secondary/50"
        />
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground font-mono">
          <span>{totalCalls.toLocaleString()} chamadas</span>
          <span>{monthlyLimit === Infinity ? '∞' : monthlyLimit.toLocaleString()} limite</span>
        </div>
      </div>

      {/* Per API Key Usage */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          Uso por API Key
          <span className="text-xs text-muted-foreground font-normal">({keys.length} keys)</span>
        </h4>
        
        {keys.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma API key criada ainda
          </p>
        ) : (
          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
            {keys.map((key) => {
              const keyUsage = monthlyLimit === Infinity ? 0 : (key.calls_count / monthlyLimit) * 100;
              const isActive = key.status === 'active';
              
              return (
                <div key={key.id} className="p-3 rounded-lg bg-secondary/20 border border-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <CheckCircle className="h-3 w-3 text-green-400" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-yellow-400" />
                      )}
                      <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                        {key.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {key.calls_count.toLocaleString()} calls
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(keyUsage, 100)} 
                    className="h-1.5 bg-secondary/50"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {key.key.substring(0, 12)}...
                    </span>
                    <span className={`text-[10px] font-mono ${getStatusColor(keyUsage)}`}>
                      {monthlyLimit === Infinity ? '-' : `${keyUsage.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Warning Banner */}
      {usagePercentage >= 80 && monthlyLimit !== Infinity && (
        <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
            <p className="text-xs text-yellow-200">
              Você está usando {usagePercentage.toFixed(0)}% do seu limite mensal. 
              Considere fazer upgrade do seu plano.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
