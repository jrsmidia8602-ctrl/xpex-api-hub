import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Crown, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ReferralBadge, getReferralTier, getTierConfig } from './ReferralBadge';

interface LeaderboardEntry {
  profile_id: string;
  referral_code: string;
  total_referrals: number;
  completed_referrals: number;
  total_credits_earned: number;
  display_name: string;
}

export const ReferralLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Get referral counts grouped by referrer
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('referrer_id, status, reward_credits')
        .in('status', ['completed', 'rewarded']);

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
        return;
      }

      // Group by referrer_id
      const referrerStats = new Map<string, { total: number; completed: number; credits: number }>();
      
      referralsData?.forEach(ref => {
        const current = referrerStats.get(ref.referrer_id) || { total: 0, completed: 0, credits: 0 };
        current.total++;
        if (ref.status === 'completed' || ref.status === 'rewarded') {
          current.completed++;
          current.credits += ref.reward_credits || 0;
        }
        referrerStats.set(ref.referrer_id, current);
      });

      // Get profile info for top referrers
      const topReferrerIds = Array.from(referrerStats.entries())
        .sort((a, b) => b[1].completed - a[1].completed)
        .slice(0, 10)
        .map(([id]) => id);

      if (topReferrerIds.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, referral_code, full_name, email, referral_credits_earned')
        .in('id', topReferrerIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      const leaderboardData: LeaderboardEntry[] = (profilesData || [])
        .map(profile => {
          const stats = referrerStats.get(profile.id) || { total: 0, completed: 0, credits: 0 };
          return {
            profile_id: profile.id,
            referral_code: profile.referral_code || 'N/A',
            total_referrals: stats.total,
            completed_referrals: stats.completed,
            total_credits_earned: profile.referral_credits_earned || stats.credits,
            display_name: profile.full_name || profile.email?.split('@')[0] || 'Usuário Anônimo'
          };
        })
        .sort((a, b) => b.completed_referrals - a.completed_referrals);

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error in fetchLeaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-5 w-5 text-yellow-400" />;
      case 1:
        return <Medal className="h-5 w-5 text-slate-300" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center text-muted-foreground font-mono">{index + 1}</span>;
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black">1º Lugar</Badge>;
      case 1:
        return <Badge className="bg-gradient-to-r from-slate-400 to-slate-300 text-black">2º Lugar</Badge>;
      case 2:
        return <Badge className="bg-gradient-to-r from-amber-600 to-orange-500 text-white">3º Lugar</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Top Referrers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Top Referrers
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Nenhum referral ainda</p>
            <p className="text-sm text-muted-foreground/70">Seja o primeiro a indicar!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.profile_id}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  index < 3 
                    ? 'bg-gradient-to-r from-primary/10 to-transparent border border-primary/20' 
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">
                        {entry.display_name}
                      </span>
                      {getRankBadge(index)}
                      <ReferralBadge completedReferrals={entry.completed_referrals} showLabel={false} size="sm" />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {entry.referral_code}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground">
                    {entry.completed_referrals} <span className="text-xs text-muted-foreground">indicações</span>
                  </div>
                  <div className="text-xs text-green-400">
                    +{entry.total_credits_earned} créditos
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
