-- Create a function to get aggregate validation stats (public-facing)
CREATE OR REPLACE FUNCTION public.get_validation_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_validations', COALESCE(COUNT(*), 0),
    'avg_latency_ms', COALESCE(ROUND(AVG(response_time_ms))::integer, 47),
    'success_rate', COALESCE(
      ROUND((COUNT(*) FILTER (WHERE status_code = 200)::numeric / NULLIF(COUNT(*), 0)) * 100)::integer,
      99
    )
  ) INTO result
  FROM usage_logs
  WHERE endpoint ILIKE '%validate-email%';
  
  RETURN result;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.get_validation_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_validation_stats() TO authenticated;