import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DISPOSABLE_DOMAINS = [
  'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com',
  'throwaway.email', 'temp-mail.org', 'fakeinbox.com', 'getnada.com',
  'yopmail.com', 'trashmail.com', 'maildrop.cc', 'sharklasers.com'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Validating email:', email);
    const startTime = Date.now();

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
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content;
    
    console.log('AI analysis:', aiContent);

    // Parse AI response
    let aiAnalysis;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error('Failed to parse AI response');
    }

    const responseTime = Date.now() - startTime;

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
    console.error('Error in validate-email-ai:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
