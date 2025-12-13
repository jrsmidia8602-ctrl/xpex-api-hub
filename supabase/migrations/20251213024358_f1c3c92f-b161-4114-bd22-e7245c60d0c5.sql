-- Create function to increment API key call count
CREATE OR REPLACE FUNCTION public.increment_api_key_calls(key_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE api_keys 
  SET calls_count = calls_count + 1,
      last_used_at = now()
  WHERE id = key_id;
END;
$$;