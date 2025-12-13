import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Disposable email domains list (expanded)
const disposableDomains = [
  'tempmail.com', 'throwaway.com', 'mailinator.com', 'guerrillamail.com',
  'temp-mail.org', '10minutemail.com', 'fakeinbox.com', 'trashmail.com',
  'yopmail.com', 'getnada.com', 'maildrop.cc', 'dispostable.com',
  'sharklasers.com', 'spam4.me', 'burnermail.io', 'tempinbox.com'
];

// Common typos in popular domains
const domainTypos: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yahho.com': 'yahoo.com',
};

async function validateApiKey(apiKey: string): Promise<{ valid: boolean; userId?: string; keyId?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, user_id, status')
    .eq('key', apiKey)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  if (data.status !== 'active') {
    return { valid: false };
  }

  return { valid: true, userId: data.user_id, keyId: data.id };
}

async function logUsage(userId: string, apiKeyId: string, endpoint: string, statusCode: number, responseTimeMs: number) {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  await supabase.from('usage_logs').insert({
    user_id: userId,
    api_key_id: apiKeyId,
    endpoint,
    status_code: statusCode,
    response_time_ms: responseTimeMs
  });

  // Update API key call count
  await supabase.rpc('increment_api_key_calls', { key_id: apiKeyId });
}

function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function checkDisposable(domain: string): boolean {
  return disposableDomains.includes(domain.toLowerCase());
}

function checkTypo(domain: string): string | null {
  return domainTypos[domain.toLowerCase()] || null;
}

function calculateScore(checks: {
  formatValid: boolean;
  isDisposable: boolean;
  hasTypo: boolean;
  mxValid: boolean;
}): number {
  let score = 0;
  if (checks.formatValid) score += 30;
  if (!checks.isDisposable) score += 25;
  if (!checks.hasTypo) score += 20;
  if (checks.mxValid) score += 25;
  return score;
}

serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API key from header
    const apiKey = req.headers.get('x-api-key');
    
    if (!apiKey) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'API key required',
        code: 'MISSING_API_KEY'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate API key
    const keyValidation = await validateApiKey(apiKey);
    
    if (!keyValidation.valid) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Invalid or inactive API key',
        code: 'INVALID_API_KEY'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const { email } = await req.json();
    
    if (!email) {
      const responseTime = Date.now() - startTime;
      await logUsage(keyValidation.userId!, keyValidation.keyId!, '/validate-email', 400, responseTime);
      
      return new Response(JSON.stringify({
        ok: false,
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Perform validations
    const formatValid = validateEmailFormat(email);
    const domain = email.split('@')[1] || '';
    const isDisposable = checkDisposable(domain);
    const typoSuggestion = checkTypo(domain);
    
    // Simple MX check (in production, you'd do actual DNS lookup)
    const commonDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'protonmail.com'];
    const mxValid = commonDomains.includes(domain.toLowerCase()) || !isDisposable;

    const score = calculateScore({
      formatValid,
      isDisposable,
      hasTypo: !!typoSuggestion,
      mxValid
    });

    const result = {
      ok: true,
      data: {
        email,
        valid: formatValid && !isDisposable && score >= 50,
        score,
        checks: {
          format_valid: formatValid,
          is_disposable: isDisposable,
          mx_valid: mxValid,
          has_typo: !!typoSuggestion
        },
        suggestion: typoSuggestion ? email.replace(domain, typoSuggestion) : null,
        risk_level: score >= 80 ? 'low' : score >= 50 ? 'medium' : 'high'
      },
      credits_used: 1,
      response_time_ms: Date.now() - startTime
    };

    // Log successful usage
    await logUsage(keyValidation.userId!, keyValidation.keyId!, '/validate-email', 200, result.response_time_ms);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in validate-email:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: (error as Error).message,
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
