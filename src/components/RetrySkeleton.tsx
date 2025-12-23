import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface RetrySkeletonProps {
  variant?: 'card' | 'table' | 'list' | 'stats' | 'chart';
  count?: number;
  className?: string;
}

export const RetrySkeleton = ({ variant = 'card', count = 1, className }: RetrySkeletonProps) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'stats') {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
        {items.map((i) => (
          <div key={i} className="rounded-lg border border-border/50 p-4 space-y-3 animate-pulse">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 bg-primary/10" />
              <Skeleton className="h-8 w-8 rounded-full bg-primary/10" />
            </div>
            <Skeleton className="h-8 w-20 bg-primary/20" />
            <Skeleton className="h-3 w-16 bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('rounded-lg border border-border/50 overflow-hidden', className)}>
        <div className="p-4 border-b border-border/50 flex gap-4">
          <Skeleton className="h-4 w-32 bg-primary/10" />
          <Skeleton className="h-4 w-24 bg-muted" />
          <Skeleton className="h-4 w-20 bg-muted" />
          <Skeleton className="h-4 w-16 bg-muted" />
        </div>
        {items.map((i) => (
          <div key={i} className="p-4 border-b border-border/30 last:border-0 flex gap-4 animate-pulse">
            <Skeleton className="h-4 w-40 bg-muted" />
            <Skeleton className="h-4 w-32 bg-muted/70" />
            <Skeleton className="h-4 w-24 bg-muted/50" />
            <Skeleton className="h-6 w-16 rounded-full bg-primary/10" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-3', className)}>
        {items.map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border/30 animate-pulse">
            <Skeleton className="h-10 w-10 rounded-full bg-primary/10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 bg-muted" />
              <Skeleton className="h-3 w-1/2 bg-muted/70" />
            </div>
            <Skeleton className="h-8 w-20 bg-muted/50" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={cn('rounded-lg border border-border/50 p-4', className)}>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32 bg-primary/10" />
          <Skeleton className="h-8 w-24 bg-muted/50" />
        </div>
        <div className="h-64 flex items-end gap-2 animate-pulse">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton 
              key={i} 
              className="flex-1 bg-primary/10" 
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div className={cn('grid gap-4', className)}>
      {items.map((i) => (
        <div key={i} className="rounded-lg border border-border/50 p-4 space-y-4 animate-pulse">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg bg-primary/10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3 bg-muted" />
              <Skeleton className="h-3 w-1/2 bg-muted/70" />
            </div>
          </div>
          <Skeleton className="h-20 w-full bg-muted/50" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 bg-primary/10" />
            <Skeleton className="h-8 w-20 bg-muted/50" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default RetrySkeleton;
