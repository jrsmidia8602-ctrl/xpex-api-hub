-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  milestone_type TEXT NOT NULL,
  milestone_value INTEGER NOT NULL,
  badge_color TEXT NOT NULL DEFAULT 'bronze',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements junction table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements are public (read-only)
CREATE POLICY "Achievements are viewable by everyone" 
ON public.achievements 
FOR SELECT 
USING (true);

-- Users can view their own achievements
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

-- System can insert user achievements
CREATE POLICY "System can insert user achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (true);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, milestone_type, milestone_value, badge_color) VALUES
('Primeiro Passo', 'Realizou sua primeira validação de email', 'star', 'validations', 1, 'bronze'),
('Explorador', 'Validou 10 emails', 'compass', 'validations', 10, 'bronze'),
('Verificador', 'Validou 50 emails', 'check-circle', 'validations', 50, 'silver'),
('Centurião', 'Validou 100 emails', 'award', 'validations', 100, 'silver'),
('Veterano', 'Validou 500 emails', 'shield', 'validations', 500, 'gold'),
('Mestre', 'Validou 1.000 emails', 'crown', 'validations', 1000, 'gold'),
('Lenda', 'Validou 5.000 emails', 'zap', 'validations', 5000, 'diamond'),
('Titã', 'Validou 10.000 emails', 'flame', 'validations', 10000, 'diamond'),
('Pioneiro', 'Criou sua primeira chave API', 'key', 'api_keys', 1, 'bronze'),
('Desenvolvedor', 'Criou 3 chaves API', 'code', 'api_keys', 3, 'silver'),
('Embaixador', 'Indicou seu primeiro usuário', 'users', 'referrals', 1, 'bronze'),
('Influenciador', 'Indicou 5 usuários', 'share-2', 'referrals', 5, 'silver'),
('Evangelista', 'Indicou 10 usuários', 'megaphone', 'referrals', 10, 'gold');

-- Create function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id UUID)
RETURNS SETOF public.user_achievements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_validation_count INTEGER;
  v_api_key_count INTEGER;
  v_referral_count INTEGER;
  v_achievement RECORD;
  v_profile_id UUID;
BEGIN
  -- Get validation count
  SELECT COUNT(*) INTO v_validation_count
  FROM usage_logs
  WHERE user_id = p_user_id AND endpoint ILIKE '%validate-email%' AND status_code = 200;
  
  -- Get API key count
  SELECT COUNT(*) INTO v_api_key_count
  FROM api_keys
  WHERE user_id = p_user_id;
  
  -- Get referral count
  SELECT id INTO v_profile_id FROM profiles WHERE user_id = p_user_id;
  
  SELECT COUNT(*) INTO v_referral_count
  FROM referrals
  WHERE referrer_id = v_profile_id AND status IN ('completed', 'rewarded');
  
  -- Check each achievement
  FOR v_achievement IN SELECT * FROM achievements LOOP
    -- Skip if already unlocked
    IF EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = p_user_id AND achievement_id = v_achievement.id
    ) THEN
      CONTINUE;
    END IF;
    
    -- Check milestone
    IF (v_achievement.milestone_type = 'validations' AND v_validation_count >= v_achievement.milestone_value)
       OR (v_achievement.milestone_type = 'api_keys' AND v_api_key_count >= v_achievement.milestone_value)
       OR (v_achievement.milestone_type = 'referrals' AND v_referral_count >= v_achievement.milestone_value)
    THEN
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (p_user_id, v_achievement.id)
      RETURNING * INTO v_achievement;
      
      RETURN NEXT v_achievement;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;