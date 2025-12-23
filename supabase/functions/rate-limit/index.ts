import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// In-memory rate limit store with TTL cleanup
interface RateLimitEntry {
  count: number;
  resetAt: number;
  blocked: boolean;
  blockUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now >= entry.resetAt && (!entry.blockUntil || now >= entry.blockUntil)) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Rate limit tiers based on subscription or API key type
export const RATE_LIMIT_TIERS = {
  free: {
    perMinute: 30,
    perHour: 500,
    perDay: 1000,
    burstLimit: 10, // Max requests in 10 seconds
  },
  starter: {
    perMinute: 100,
    perHour: 2000,
    perDay: 10000,
    burstLimit: 30,
  },
  professional: {
    perMinute: 300,
    perHour: 10000,
    perDay: 50000,
    burstLimit: 100,
  },
  enterprise: {
    perMinute: 1000,
    perHour: 50000,
    perDay: 500000,
    burstLimit: 500,
  },
  anonymous: {
    perMinute: 10,
    perHour: 50,
    perDay: 100,
    burstLimit: 5,
  },
};

interface RateLimitConfig {
  identifier: string;
  tier?: keyof typeof RATE_LIMIT_TIERS;
  endpoint?: string;
  customLimits?: {
    perMinute?: number;
    perHour?: number;
    perDay?: number;
    burstLimit?: number;
  };
}

interface RateLimitResult {
  allowed: boolean;
  remaining: {
    perMinute: number;
    perHour: number;
    perDay: number;
  };
  resetAt: {
    perMinute: number;
    perHour: number;
    perDay: number;
  };
  retryAfter?: number;
  blocked: boolean;
  blockReason?: string;
}

function getWindowKey(identifier: string, window: string): string {
  return `${identifier}:${window}`;
}

function checkWindow(
  identifier: string,
  window: 'minute' | 'hour' | 'day' | 'burst',
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = getWindowKey(identifier, window);
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Clean expired entries
  if (entry && now >= entry.resetAt) {
    rateLimitStore.delete(key);
  }

  const currentEntry = rateLimitStore.get(key);

  if (!currentEntry) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt, blocked: false });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (currentEntry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: currentEntry.resetAt };
  }

  currentEntry.count++;
  return { 
    allowed: true, 
    remaining: maxRequests - currentEntry.count, 
    resetAt: currentEntry.resetAt 
  };
}

function checkRateLimits(config: RateLimitConfig): RateLimitResult {
  const tier = config.tier || 'anonymous';
  const limits = config.customLimits || RATE_LIMIT_TIERS[tier];
  const identifier = config.endpoint 
    ? `${config.identifier}:${config.endpoint}` 
    : config.identifier;

  // Check if blocked
  const blockKey = `block:${config.identifier}`;
  const blockEntry = rateLimitStore.get(blockKey);
  if (blockEntry?.blocked && blockEntry.blockUntil && Date.now() < blockEntry.blockUntil) {
    return {
      allowed: false,
      remaining: { perMinute: 0, perHour: 0, perDay: 0 },
      resetAt: { perMinute: 0, perHour: 0, perDay: 0 },
      retryAfter: Math.ceil((blockEntry.blockUntil - Date.now()) / 1000),
      blocked: true,
      blockReason: 'Too many rate limit violations. Temporarily blocked.',
    };
  }

  // Check burst limit (10 second window)
  const burstCheck = checkWindow(
    identifier, 
    'burst', 
    limits.burstLimit || 10, 
    10 * 1000
  );

  // Check minute limit
  const minuteCheck = checkWindow(
    identifier, 
    'minute', 
    limits.perMinute || 30, 
    60 * 1000
  );

  // Check hour limit
  const hourCheck = checkWindow(
    identifier, 
    'hour', 
    limits.perHour || 500, 
    60 * 60 * 1000
  );

  // Check day limit
  const dayCheck = checkWindow(
    identifier, 
    'day', 
    limits.perDay || 1000, 
    24 * 60 * 60 * 1000
  );

  const allowed = burstCheck.allowed && minuteCheck.allowed && hourCheck.allowed && dayCheck.allowed;

  // Track violations for potential blocking
  if (!allowed) {
    const violationKey = `violations:${config.identifier}`;
    const violations = rateLimitStore.get(violationKey);
    const now = Date.now();

    if (!violations) {
      rateLimitStore.set(violationKey, { 
        count: 1, 
        resetAt: now + 60 * 60 * 1000, // 1 hour
        blocked: false 
      });
    } else {
      violations.count++;
      
      // Block after 10 violations in an hour
      if (violations.count >= 10) {
        rateLimitStore.set(blockKey, {
          count: 0,
          resetAt: now + 15 * 60 * 1000, // 15 min block
          blocked: true,
          blockUntil: now + 15 * 60 * 1000,
        });
        console.log(`[RATE-LIMIT] Blocked identifier: ${config.identifier}`);
      }
    }
  }

  let retryAfter: number | undefined;
  if (!allowed) {
    const earliestReset = Math.min(
      burstCheck.allowed ? Infinity : burstCheck.resetAt,
      minuteCheck.allowed ? Infinity : minuteCheck.resetAt,
      hourCheck.allowed ? Infinity : hourCheck.resetAt,
      dayCheck.allowed ? Infinity : dayCheck.resetAt
    );
    retryAfter = Math.ceil((earliestReset - Date.now()) / 1000);
  }

  return {
    allowed,
    remaining: {
      perMinute: minuteCheck.remaining,
      perHour: hourCheck.remaining,
      perDay: dayCheck.remaining,
    },
    resetAt: {
      perMinute: minuteCheck.resetAt,
      perHour: hourCheck.resetAt,
      perDay: dayCheck.resetAt,
    },
    retryAfter,
    blocked: false,
  };
}

function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit-Minute': '30',
    'X-RateLimit-Remaining-Minute': result.remaining.perMinute.toString(),
    'X-RateLimit-Remaining-Hour': result.remaining.perHour.toString(),
    'X-RateLimit-Remaining-Day': result.remaining.perDay.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt.perMinute / 1000).toString(),
    ...(result.retryAfter ? { 'Retry-After': result.retryAfter.toString() } : {}),
  };
}

async function getApiKeyTier(apiKey: string): Promise<keyof typeof RATE_LIMIT_TIERS> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    const { data: keyData } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key', apiKey)
      .single();

    if (!keyData) return 'anonymous';

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('user_id', keyData.user_id)
      .single();

    const tier = profile?.subscription_tier?.toLowerCase();
    
    if (tier === 'professional' || tier === 'pro') return 'professional';
    if (tier === 'enterprise') return 'enterprise';
    if (tier === 'starter') return 'starter';
    return 'free';
  } catch {
    return 'free';
  }
}

// Main handler for rate limit check endpoint
serve(async (req) => {
  console.log('[RATE-LIMIT] Request received');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identifier, tier, endpoint, apiKey } = await req.json();

    if (!identifier) {
      return new Response(JSON.stringify({
        error: 'identifier is required',
        code: 'MISSING_IDENTIFIER',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine tier from API key if provided
    let effectiveTier = tier as keyof typeof RATE_LIMIT_TIERS;
    if (apiKey && !tier) {
      effectiveTier = await getApiKeyTier(apiKey);
    }

    const result = checkRateLimits({
      identifier,
      tier: effectiveTier,
      endpoint,
    });

    console.log('[RATE-LIMIT] Check result:', {
      identifier,
      tier: effectiveTier,
      allowed: result.allowed,
      remaining: result.remaining.perMinute,
    });

    if (!result.allowed) {
      return new Response(JSON.stringify({
        ok: false,
        error: result.blocked ? result.blockReason : 'Rate limit exceeded',
        code: result.blocked ? 'BLOCKED' : 'RATE_LIMIT_EXCEEDED',
        retry_after_seconds: result.retryAfter,
        limits: result.remaining,
        reset_at: {
          minute: new Date(result.resetAt.perMinute).toISOString(),
          hour: new Date(result.resetAt.perHour).toISOString(),
          day: new Date(result.resetAt.perDay).toISOString(),
        },
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          ...getRateLimitHeaders(result),
        },
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      allowed: true,
      tier: effectiveTier,
      limits: {
        remaining: result.remaining,
        reset_at: {
          minute: new Date(result.resetAt.perMinute).toISOString(),
          hour: new Date(result.resetAt.perHour).toISOString(),
          day: new Date(result.resetAt.perDay).toISOString(),
        },
      },
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        ...getRateLimitHeaders(result),
      },
    });
  } catch (error) {
    console.error('[RATE-LIMIT] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal error',
      code: 'INTERNAL_ERROR',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
