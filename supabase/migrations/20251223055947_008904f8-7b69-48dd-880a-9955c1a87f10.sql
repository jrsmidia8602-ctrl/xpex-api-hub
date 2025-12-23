-- Create table to store configuration backups
CREATE TABLE public.configuration_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('webhooks', 'notification_preferences', 'full')),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days')
);

-- Enable RLS
ALTER TABLE public.configuration_backups ENABLE ROW LEVEL SECURITY;

-- Users can view their own backups
CREATE POLICY "Users can view their own backups"
ON public.configuration_backups
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own backups
CREATE POLICY "Users can insert their own backups"
ON public.configuration_backups
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own backups
CREATE POLICY "Users can delete their own backups"
ON public.configuration_backups
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_configuration_backups_user_type ON public.configuration_backups(user_id, backup_type);
CREATE INDEX idx_configuration_backups_expires ON public.configuration_backups(expires_at);