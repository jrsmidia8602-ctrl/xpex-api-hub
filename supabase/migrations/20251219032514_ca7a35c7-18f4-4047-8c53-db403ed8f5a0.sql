-- =============================================
-- REFERRAL SYSTEM TABLES
-- =============================================

-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_credits_earned INTEGER DEFAULT 0;

-- Create index for referral code lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- Referrals tracking table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded', 'expired')),
  reward_credits INTEGER DEFAULT 100,
  completed_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals as referrer"
ON public.referrals FOR SELECT
USING (referrer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view referrals where they are referred"
ON public.referrals FOR SELECT
USING (referred_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can insert referrals"
ON public.referrals FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update referrals"
ON public.referrals FOR UPDATE
USING (true);

-- Function to generate referral code for new users
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'XPEX' || UPPER(SUBSTRING(MD5(NEW.id::text || now()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate referral code
DROP TRIGGER IF EXISTS trigger_generate_referral_code ON public.profiles;
CREATE TRIGGER trigger_generate_referral_code
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();

-- Function to process referral completion
CREATE OR REPLACE FUNCTION public.complete_referral(p_referred_user_id UUID, p_referral_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_profile_id UUID;
  v_referred_profile_id UUID;
  v_referral_id UUID;
  v_reward_credits INTEGER := 100;
BEGIN
  -- Find referrer by code
  SELECT id INTO v_referrer_profile_id
  FROM public.profiles
  WHERE referral_code = p_referral_code;
  
  IF v_referrer_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Find referred user's profile
  SELECT id INTO v_referred_profile_id
  FROM public.profiles
  WHERE user_id = p_referred_user_id;
  
  IF v_referred_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Prevent self-referral
  IF v_referrer_profile_id = v_referred_profile_id THEN
    RETURN FALSE;
  END IF;
  
  -- Create referral record
  INSERT INTO public.referrals (referrer_id, referred_id, referral_code, status, reward_credits, completed_at)
  VALUES (v_referrer_profile_id, v_referred_profile_id, p_referral_code, 'completed', v_reward_credits, now())
  RETURNING id INTO v_referral_id;
  
  -- Update referred user's profile
  UPDATE public.profiles
  SET referred_by = v_referrer_profile_id
  WHERE id = v_referred_profile_id;
  
  -- Credit the referrer
  UPDATE public.profiles
  SET credits = credits + v_reward_credits,
      referral_credits_earned = referral_credits_earned + v_reward_credits
  WHERE id = v_referrer_profile_id;
  
  -- Mark referral as rewarded
  UPDATE public.referrals
  SET status = 'rewarded', rewarded_at = now()
  WHERE id = v_referral_id;
  
  RETURN TRUE;
END;
$$;

-- =============================================
-- WEBHOOK SYSTEM TABLES
-- =============================================

-- Webhooks configuration table
CREATE TABLE public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  events TEXT[] NOT NULL DEFAULT ARRAY['usage.threshold', 'usage.limit_reached', 'credits.low', 'credits.depleted'],
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhooks"
ON public.webhooks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhooks"
ON public.webhooks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhooks"
ON public.webhooks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhooks"
ON public.webhooks FOR DELETE
USING (auth.uid() = user_id);

-- Webhook delivery logs
CREATE TABLE public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their webhook logs"
ON public.webhook_logs FOR SELECT
USING (webhook_id IN (SELECT id FROM public.webhooks WHERE user_id = auth.uid()));

-- Index for faster log queries
CREATE INDEX idx_webhook_logs_webhook_id ON public.webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);

-- Trigger for updated_at on webhooks
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();