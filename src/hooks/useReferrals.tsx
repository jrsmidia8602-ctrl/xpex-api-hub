import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  referral_code: string;
  status: 'pending' | 'completed' | 'rewarded' | 'expired';
  reward_credits: number;
  completed_at: string | null;
  rewarded_at: string | null;
  created_at: string;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalCreditsEarned: number;
  referralCode: string | null;
}

export const useReferrals = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchReferrals = async () => {
    if (!user) {
      setReferrals([]);
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      // Get user's profile to get referral code
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, referral_code, referral_credits_earned')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      // Get referrals where user is the referrer
      const { data: referralsData, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching referrals:', error);
        return;
      }

      const typedReferrals = (referralsData || []) as Referral[];
      setReferrals(typedReferrals);

      // Calculate stats
      const completed = typedReferrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length;
      const pending = typedReferrals.filter(r => r.status === 'pending').length;

      setStats({
        totalReferrals: typedReferrals.length,
        completedReferrals: completed,
        pendingReferrals: pending,
        totalCreditsEarned: profile.referral_credits_earned || 0,
        referralCode: profile.referral_code
      });
    } catch (error) {
      console.error('Error in fetchReferrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyReferralCode = async (code: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para usar um código de indicação');
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('complete_referral', {
        p_referred_user_id: user.id,
        p_referral_code: code.toUpperCase()
      });

      if (error) {
        console.error('Error applying referral code:', error);
        toast.error('Código de indicação inválido');
        return false;
      }

      if (data) {
        toast.success('Código de indicação aplicado! Você e seu amigo ganharam créditos.');
        return true;
      } else {
        toast.error('Código de indicação inválido ou já utilizado');
        return false;
      }
    } catch (error) {
      console.error('Error applying referral code:', error);
      toast.error('Erro ao aplicar código de indicação');
      return false;
    }
  };

  const copyReferralLink = () => {
    if (stats?.referralCode) {
      const link = `${window.location.origin}/auth?ref=${stats.referralCode}`;
      navigator.clipboard.writeText(link);
      toast.success('Link de indicação copiado!');
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [user]);

  return {
    referrals,
    stats,
    loading,
    applyReferralCode,
    copyReferralLink,
    refetch: fetchReferrals
  };
};
