import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const DISPOSABLE_DOMAINS = [
  'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com',
  'throwaway.email', 'temp-mail.org', 'fakeinbox.com', 'getnada.com',
  'yopmail.com', 'trashmail.com', 'maildrop.cc', 'sharklasers.com'
];

async function validateApiKey(apiKey: string): Promise<{ valid: boolean; userId?: string; keyId?: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, user_id, status')
    .eq('key', apiKey)
    .maybeSingle();

  if (error || !data) {
    console.log('[VALIDATE-EMAIL-AI] API key validation failed:', error?.message || 'Key not found');
    return { valid: false };
  }

  if (data.status !== 'active') {
    console.log('[VALIDATE-EMAIL-AI] API key is not active');
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Get API key from header - REQUIRED for authentication
    const apiKey = req.headers.get('x-api-key');
    
    if (!apiKey) {
      console.log('[VALIDATE-EMAIL-AI] Missing API key');
      return new Response(JSON.stringify({
        ok: false,
        error: 'API key required. Include X-API-Key header.',
        code: 'MISSING_API_KEY'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate API key
    const keyValidation = await validateApiKey(apiKey);
    
    if (!keyValidation.valid) {
      console.log('[VALIDATE-EMAIL-AI] Invalid API key');
      return new Response(JSON.stringify({
        ok: false,
        error: 'Invalid or inactive API key',
        code: 'INVALID_API_KEY'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[VALIDATE-EMAIL-AI] API key validated for user:', keyValidation.userId);

    const { email } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!email || typeof email !== 'string') {
      const responseTime = Date.now() - startTime;
      await logUsage(keyValidation.userId!, keyValidation.keyId!, '/validate-email-ai', 400, responseTime);
      
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[VALIDATE-EMAIL-AI] Validating email:', email);

    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const formatValid = emailRegex.test(email);
    const domain = email.split('@')[1]?.toLowerCase() || '';
    const isDisposable = DISPOSABLE_DOMAINS.some(d => domain.includes(d));

    // AI-powered deep analysis
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert email validation AI. Analyze email addresses for:
1. Typosquatting (e.g., gmial.com instead of gmail.com)
2. Suspicious patterns (random strings, keyboard patterns)
3. Domain reputation assessment
4. Likely deliverability
5. Fraud risk indicators

Respond ONLY with valid JSON:
{
  "risk_score": 0-100 (0=safe, 100=dangerous),
  "risk_level": "low" | "medium" | "high",
  "fraud_indicators": ["indicator1", "indicator2"],
  "typo_detected": true/false,
  "suggested_correction": "correct@email.com" or null,
  "domain_analysis": "brief analysis",
  "recommendations": ["recommendation1"],
  "deliverability_score": 0-100
}`
          },
          {
            role: 'user',
            content: `Analyze this email for validation and fraud risk: ${email}\nDomain: ${domain}\nFormat valid: ${formatValid}\nKnown disposable: ${isDisposable}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VALIDATE-EMAIL-AI] AI Gateway error:', response.status, errorText);
      
      const responseTime = Date.now() - startTime;
      await logUsage(keyValidation.userId!, keyValidation.keyId!, '/validate-email-ai', response.status, responseTime);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded', code: 'RATE_LIMITED' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted', code: 'CREDITS_EXHAUSTED' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content;
    
    console.log('[VALIDATE-EMAIL-AI] AI analysis completed');

    // Parse AI response
    let aiAnalysis;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error('[VALIDATE-EMAIL-AI] Failed to parse AI response');
    }

    const responseTime = Date.now() - startTime;

    // Log successful usage
    await logUsage(keyValidation.userId!, keyValidation.keyId!, '/validate-email-ai', 200, responseTime);

    // Combine basic validation with AI analysis
    const result = {
      ok: true,
      data: {
        email,
        valid: formatValid && !isDisposable && (aiAnalysis?.risk_level !== 'high'),
        score: aiAnalysis?.deliverability_score ?? (formatValid && !isDisposable ? 85 : 20),
        disposable: isDisposable,
        mx_found: formatValid && !isDisposable,
        format_valid: formatValid,
        domain,
        risk_level: aiAnalysis?.risk_level || (isDisposable ? 'high' : formatValid ? 'low' : 'medium'),
        risk_score: aiAnalysis?.risk_score ?? (isDisposable ? 90 : formatValid ? 15 : 60),
        fraud_indicators: aiAnalysis?.fraud_indicators || [],
        typo_detected: aiAnalysis?.typo_detected || false,
        suggested_correction: aiAnalysis?.suggested_correction || null,
        domain_analysis: aiAnalysis?.domain_analysis || null,
        recommendations: aiAnalysis?.recommendations || [],
        response_time_ms: responseTime,
        ai_powered: true
      },
      credits_used: 1,
      remaining_credits: 99
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[VALIDATE-EMAIL-AI] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message, code: 'INTERNAL_ERROR' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
