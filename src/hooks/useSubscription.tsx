import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SubscriptionStatus {
  subscribed: boolean;
  tier: 'free' | 'pro' | 'enterprise';
  subscriptionEnd: string | null;
  monthlyCredits: number;
}

// Stripe price IDs
export const STRIPE_PRICES = {
  pro: 'price_1SdiUmHDcsx7lyooOieP0TLb',
  enterprise: 'price_1SdigPHDcsx7lyoo9ciVaLVQ'
} as const;

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    subscribed: false,
    tier: 'free',
    subscriptionEnd: null,
    monthlyCredits: 100
  });
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();

  const checkSubscription = useCallback(async () => {
    // Get fresh session to ensure token is not expired
    const { data: { session: freshSession } } = await supabase.auth.getSession();
    
    if (!freshSession?.access_token) {
      setSubscription({
        subscribed: false,
        tier: 'free',
        subscriptionEnd: null,
        monthlyCredits: 100
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${freshSession.access_token}`
        }
      });

      if (error) throw error;

      setSubscription({
        subscribed: data.subscribed,
        tier: data.tier || 'free',
        subscriptionEnd: data.subscription_end,
        monthlyCredits: data.monthly_credits || 100
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Only check subscription if user is authenticated
    if (user) {
      checkSubscription();
    } else {
      setSubscription({
        subscribed: false,
        tier: 'free',
        subscriptionEnd: null,
        monthlyCredits: 100
      });
      setLoading(false);
    }
  }, [user, checkSubscription]);

  // Refresh every minute only when user is authenticated
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const startCheckout = async (tier: 'pro' | 'enterprise') => {
    // Get fresh session to ensure token is not expired
    const { data: { session: freshSession } } = await supabase.auth.getSession();
    
    if (!freshSession?.access_token) {
      toast.error('Please sign in to subscribe');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${freshSession.access_token}`
        },
        body: {
          priceId: STRIPE_PRICES[tier],
          mode: 'subscription'
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      toast.error('Failed to start checkout');
    }
  };

  const openCustomerPortal = async () => {
    // Get fresh session to ensure token is not expired
    const { data: { session: freshSession } } = await supabase.auth.getSession();
    
    if (!freshSession?.access_token) {
      toast.error('Please sign in first');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${freshSession.access_token}`
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management');
    }
  };

  return {
    subscription,
    loading,
    checkSubscription,
    startCheckout,
    openCustomerPortal
  };
};
