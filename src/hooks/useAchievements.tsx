import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  milestone_type: string;
  milestone_value: number;
  badge_color: string;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export const useAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  const fetchAchievements = async () => {
    try {
      // Fetch all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('milestone_value', { ascending: true });

      if (achievementsError) throw achievementsError;
      setAchievements(allAchievements || []);

      // Fetch user achievements if logged in
      if (user) {
        const { data: userAchs, error: userAchsError } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', user.id);

        if (userAchsError) throw userAchsError;
        setUserAchievements(userAchs || []);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAchievements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error checking achievements:', error);
        return;
      }

      if (data && data.length > 0) {
        // Get the newly unlocked achievement details
        const newAchIds = data.map((ua: any) => ua.achievement_id);
        const newAchs = achievements.filter(a => newAchIds.includes(a.id));
        
        setNewAchievements(newAchs);
        
        newAchs.forEach((ach: Achievement) => {
          toast.success(`🏆 Conquista Desbloqueada: ${ach.name}!`, {
            description: ach.description,
            duration: 5000,
          });
        });

        // Refresh user achievements
        await fetchAchievements();
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [user]);

  // Check achievements periodically
  useEffect(() => {
    if (!user || achievements.length === 0) return;

    // Initial check
    checkAchievements();

    // Check every 30 seconds
    const interval = setInterval(checkAchievements, 30000);
    return () => clearInterval(interval);
  }, [user, achievements.length]);

  const isUnlocked = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getUnlockedDate = (achievementId: string) => {
    const ua = userAchievements.find(ua => ua.achievement_id === achievementId);
    return ua ? new Date(ua.unlocked_at) : null;
  };

  const getProgress = (achievement: Achievement, stats: { validations: number; apiKeys: number; referrals: number }) => {
    let current = 0;
    switch (achievement.milestone_type) {
      case 'validations':
        current = stats.validations;
        break;
      case 'api_keys':
        current = stats.apiKeys;
        break;
      case 'referrals':
        current = stats.referrals;
        break;
    }
    return Math.min(100, (current / achievement.milestone_value) * 100);
  };

  return {
    achievements,
    userAchievements,
    loading,
    newAchievements,
    isUnlocked,
    getUnlockedDate,
    getProgress,
    checkAchievements,
    refetch: fetchAchievements,
  };
};
