import { RefreshCw, WifiOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RetryIndicatorProps {
  isRetrying: boolean;
  retryCount: number;
  nextRetryIn: number | null;
  onCancel?: () => void;
  onRetryNow?: () => void;
  className?: string;
}

export const RetryIndicator = ({
  isRetrying,
  retryCount,
  nextRetryIn,
  onCancel,
  onRetryNow,
  className,
}: RetryIndicatorProps) => {
  if (!isRetrying) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 px-4 py-3 rounded-lg',
        'bg-destructive/10 border border-destructive/20 backdrop-blur-sm',
        'shadow-lg animate-fade-in',
        className
      )}
    >
      <div className="flex items-center gap-2 text-destructive">
        <WifiOff className="h-4 w-4" />
        <RefreshCw className="h-4 w-4 animate-spin" />
      </div>
      
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          Conexão perdida
        </span>
        <span className="text-xs text-muted-foreground">
          Tentativa {retryCount} • Reconectando{nextRetryIn ? ` em ${nextRetryIn}s` : '...'}
        </span>
      </div>

      <div className="flex items-center gap-2 ml-2">
        {onRetryNow && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetryNow}
            className="h-7 px-2 text-xs hover:bg-destructive/10"
          >
            Tentar agora
          </Button>
        )}
        {onCancel && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-7 w-7 hover:bg-destructive/10"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default RetryIndicator;
