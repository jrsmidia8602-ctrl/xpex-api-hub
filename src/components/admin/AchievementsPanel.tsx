import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Star, 
  Compass, 
  CheckCircle, 
  Award, 
  Shield, 
  Crown, 
  Zap, 
  Flame,
  Key,
  Code,
  Users,
  Share2,
  Megaphone,
  Lock
} from 'lucide-react';
import { useAchievements, Achievement } from '@/hooks/useAchievements';
import { useUsageLogs } from '@/hooks/useUsageLogs';
import { useAPIKeys } from '@/hooks/useAPIKeys';
import { useReferrals } from '@/hooks/useReferrals';
import { cn } from '@/lib/utils';

const iconMap: Record<string, any> = {
  star: Star,
  compass: Compass,
  'check-circle': CheckCircle,
  award: Award,
  shield: Shield,
  crown: Crown,
  zap: Zap,
  flame: Flame,
  key: Key,
  code: Code,
  users: Users,
  'share-2': Share2,
  megaphone: Megaphone,
};

const colorMap: Record<string, string> = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-slate-300 to-slate-500',
  gold: 'from-yellow-400 to-amber-500',
  diamond: 'from-cyan-300 to-blue-500',
};

const bgColorMap: Record<string, string> = {
  bronze: 'bg-amber-500/10 border-amber-500/30',
  silver: 'bg-slate-400/10 border-slate-400/30',
  gold: 'bg-yellow-500/10 border-yellow-500/30',
  diamond: 'bg-cyan-400/10 border-cyan-400/30',
};

export const AchievementsPanel = () => {
  const { achievements, isUnlocked, getUnlockedDate, getProgress, loading } = useAchievements();
  const { stats } = useUsageLogs();
  const { keys } = useAPIKeys();
  const { stats: referralStats } = useReferrals();
  const [activeTab, setActiveTab] = useState('all');

  const userStats = {
    validations: stats?.totalCalls || 0,
    apiKeys: keys?.length || 0,
    referrals: referralStats?.completedReferrals || 0,
  };

  const unlockedCount = achievements.filter(a => isUnlocked(a.id)).length;

  const filteredAchievements = achievements.filter(a => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unlocked') return isUnlocked(a.id);
    if (activeTab === 'locked') return !isUnlocked(a.id);
    return a.milestone_type === activeTab;
  });

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted/50 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Conquistas
          </CardTitle>
          <Badge variant="secondary" className="font-mono">
            {unlockedCount}/{achievements.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="unlocked">
              <Trophy className="h-3 w-3 mr-1" />
              {unlockedCount}
            </TabsTrigger>
            <TabsTrigger value="validations">Validações</TabsTrigger>
            <TabsTrigger value="api_keys">API Keys</TabsTrigger>
            <TabsTrigger value="referrals">Indicações</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-3">
            {filteredAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                unlocked={isUnlocked(achievement.id)}
                unlockedAt={getUnlockedDate(achievement.id)}
                progress={getProgress(achievement, userStats)}
              />
            ))}

            {filteredAchievements.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma conquista encontrada nesta categoria.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt: Date | null;
  progress: number;
}

const AchievementCard = ({ achievement, unlocked, unlockedAt, progress }: AchievementCardProps) => {
  const IconComponent = iconMap[achievement.icon] || Trophy;

  return (
    <div
      className={cn(
        'relative p-4 rounded-lg border transition-all duration-300',
        unlocked 
          ? bgColorMap[achievement.badge_color]
          : 'bg-muted/20 border-border/30 opacity-60'
      )}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            unlocked
              ? `bg-gradient-to-br ${colorMap[achievement.badge_color]}`
              : 'bg-muted'
          )}
        >
          {unlocked ? (
            <IconComponent className="w-6 h-6 text-white" />
          ) : (
            <Lock className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              'font-semibold truncate',
              unlocked ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {achievement.name}
            </h4>
            <Badge
              variant="outline"
              className={cn(
                'text-xs capitalize',
                unlocked && `border-${achievement.badge_color}-500/50`
              )}
            >
              {achievement.badge_color}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {achievement.description}
          </p>
          
          {!unlocked && (
            <div className="mt-2">
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(progress)}% completo
              </p>
            </div>
          )}

          {unlocked && unlockedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Desbloqueado em {unlockedAt.toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        {/* Unlocked indicator */}
        {unlocked && (
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
        )}
      </div>
    </div>
  );
};
