import { RefreshCw, WifiOff, X, CloudOff, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface RetryIndicatorProps {
  isRetrying: boolean;
  retryCount: number;
  nextRetryIn: number | null;
  maxRetries?: number;
  isOffline?: boolean;
  onCancel?: () => void;
  onRetryNow?: () => void;
  className?: string;
}

export const RetryIndicator = ({
  isRetrying,
  retryCount,
  nextRetryIn,
  maxRetries = 3,
  isOffline = false,
  onCancel,
  onRetryNow,
  className,
}: RetryIndicatorProps) => {
  if (!isRetrying && !isOffline) return null;

  const progress = maxRetries > 0 ? ((retryCount) / maxRetries) * 100 : 0;

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'flex flex-col gap-2 px-4 py-3 rounded-lg min-w-[320px]',
        isOffline 
          ? 'bg-warning/10 border border-warning/20' 
          : 'bg-destructive/10 border border-destructive/20',
        'backdrop-blur-sm shadow-lg animate-fade-in',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex items-center gap-2',
          isOffline ? 'text-warning' : 'text-destructive'
        )}>
          {isOffline ? (
            <CloudOff className="h-4 w-4" />
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <RefreshCw className="h-4 w-4 animate-spin" />
            </>
          )}
        </div>
        
        <div className="flex flex-col flex-1">
          <span className="text-sm font-medium text-foreground">
            {isOffline ? 'Modo offline' : 'Conexão perdida'}
          </span>
          <span className="text-xs text-muted-foreground">
            {isOffline 
              ? 'Dados salvos localmente • Aguardando conexão'
              : `Tentativa ${retryCount}/${maxRetries} • Reconectando${nextRetryIn ? ` em ${nextRetryIn}s` : '...'}`
            }
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isOffline && onRetryNow && (
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
              className={cn(
                'h-7 w-7',
                isOffline ? 'hover:bg-warning/10' : 'hover:bg-destructive/10'
              )}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {!isOffline && retryCount > 0 && (
        <Progress 
          value={progress} 
          className="h-1 bg-destructive/20"
        />
      )}

      {isOffline && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wifi className="h-3 w-3 animate-pulse" />
          <span>Sincronização automática quando online</span>
        </div>
      )}
    </div>
  );
};

export default RetryIndicator;
