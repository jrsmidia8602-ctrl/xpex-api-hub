import { Shield, Award, Crown, Gem } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ReferralTier = 'bronze' | 'silver' | 'gold' | 'diamond' | null;

interface ReferralBadgeProps {
  completedReferrals: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const getReferralTier = (completedReferrals: number): ReferralTier => {
  if (completedReferrals >= 50) return 'diamond';
  if (completedReferrals >= 25) return 'gold';
  if (completedReferrals >= 10) return 'silver';
  if (completedReferrals >= 3) return 'bronze';
  return null;
};

export const getTierConfig = (tier: ReferralTier) => {
  switch (tier) {
    case 'diamond':
      return {
        label: 'Diamante',
        icon: Gem,
        gradient: 'from-cyan-400 via-blue-500 to-purple-500',
        bgGradient: 'bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-500/20',
        borderColor: 'border-cyan-400/50',
        textColor: 'text-cyan-400',
        minReferrals: 50,
      };
    case 'gold':
      return {
        label: 'Ouro',
        icon: Crown,
        gradient: 'from-yellow-400 to-amber-500',
        bgGradient: 'bg-gradient-to-r from-yellow-400/20 to-amber-500/20',
        borderColor: 'border-yellow-400/50',
        textColor: 'text-yellow-400',
        minReferrals: 25,
      };
    case 'silver':
      return {
        label: 'Prata',
        icon: Award,
        gradient: 'from-slate-300 to-slate-400',
        bgGradient: 'bg-gradient-to-r from-slate-300/20 to-slate-400/20',
        borderColor: 'border-slate-300/50',
        textColor: 'text-slate-300',
        minReferrals: 10,
      };
    case 'bronze':
      return {
        label: 'Bronze',
        icon: Shield,
        gradient: 'from-amber-600 to-orange-600',
        bgGradient: 'bg-gradient-to-r from-amber-600/20 to-orange-600/20',
        borderColor: 'border-amber-600/50',
        textColor: 'text-amber-500',
        minReferrals: 3,
      };
    default:
      return null;
  }
};

export const ReferralBadge = ({ completedReferrals, showLabel = true, size = 'md' }: ReferralBadgeProps) => {
  const tier = getReferralTier(completedReferrals);
  const config = getTierConfig(tier);

  if (!tier || !config) return null;

  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Badge 
      className={cn(
        'gap-1 border',
        config.bgGradient,
        config.borderColor,
        config.textColor
      )}
    >
      <Icon className={sizeClasses[size]} />
      {showLabel && <span className="font-semibold">{config.label}</span>}
    </Badge>
  );
};

export const TierProgress = ({ completedReferrals }: { completedReferrals: number }) => {
  const currentTier = getReferralTier(completedReferrals);
  const tiers: ReferralTier[] = ['bronze', 'silver', 'gold', 'diamond'];
  
  const getNextTier = () => {
    if (!currentTier) return 'bronze';
    const currentIndex = tiers.indexOf(currentTier);
    if (currentIndex >= tiers.length - 1) return null;
    return tiers[currentIndex + 1];
  };

  const nextTier = getNextTier();
  const nextConfig = nextTier ? getTierConfig(nextTier) : null;
  const currentConfig = currentTier ? getTierConfig(currentTier) : null;

  if (!nextConfig) {
    return (
      <div className="text-center py-2">
        <p className="text-sm text-muted-foreground">
          🎉 Você alcançou o nível máximo!
        </p>
      </div>
    );
  }

  const remaining = nextConfig.minReferrals - completedReferrals;
  const progress = currentConfig 
    ? ((completedReferrals - currentConfig.minReferrals) / (nextConfig.minReferrals - currentConfig.minReferrals)) * 100
    : (completedReferrals / nextConfig.minReferrals) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Próximo nível: {nextConfig.label}</span>
        <span>{remaining} indicações restantes</span>
      </div>
      <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
        <div 
          className={cn('h-full rounded-full bg-gradient-to-r', nextConfig.gradient)}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
};
