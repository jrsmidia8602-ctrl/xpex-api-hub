import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms: number;
  message?: string;
  last_checked: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime_seconds: number;
  services: ServiceStatus[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

const startTime = Date.now();

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  const name = 'database';
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { error } = await supabase.from('profiles').select('id').limit(1);
    const latency = Date.now() - start;
    
    if (error) {
      return {
        name,
        status: 'unhealthy',
        latency_ms: latency,
        message: error.message,
        last_checked: new Date().toISOString(),
      };
    }
    
    return {
      name,
      status: latency > 1000 ? 'degraded' : 'healthy',
      latency_ms: latency,
      message: latency > 1000 ? 'High latency detected' : 'Connected',
      last_checked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name,
      status: 'unhealthy',
      latency_ms: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
      last_checked: new Date().toISOString(),
    };
  }
}

async function checkStripe(): Promise<ServiceStatus> {
  const start = Date.now();
  const name = 'stripe';
  
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeKey) {
      return {
        name,
        status: 'unhealthy',
        latency_ms: 0,
        message: 'API key not configured',
        last_checked: new Date().toISOString(),
      };
    }
    
    const response = await fetch('https://api.stripe.com/v1/balance', {
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
      },
    });
    
    const latency = Date.now() - start;
    
    if (!response.ok) {
      return {
        name,
        status: 'degraded',
        latency_ms: latency,
        message: `API returned ${response.status}`,
        last_checked: new Date().toISOString(),
      };
    }
    
    return {
      name,
      status: latency > 2000 ? 'degraded' : 'healthy',
      latency_ms: latency,
      message: 'Connected',
      last_checked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name,
      status: 'unhealthy',
      latency_ms: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
      last_checked: new Date().toISOString(),
    };
  }
}

async function checkResend(): Promise<ServiceStatus> {
  const start = Date.now();
  const name = 'email_service';
  
  try {
    const resendKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendKey) {
      return {
        name,
        status: 'degraded',
        latency_ms: 0,
        message: 'API key not configured',
        last_checked: new Date().toISOString(),
      };
    }
    
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${resendKey}`,
      },
    });
    
    const latency = Date.now() - start;
    
    if (!response.ok) {
      return {
        name,
        status: 'degraded',
        latency_ms: latency,
        message: `API returned ${response.status}`,
        last_checked: new Date().toISOString(),
      };
    }
    
    return {
      name,
      status: latency > 2000 ? 'degraded' : 'healthy',
      latency_ms: latency,
      message: 'Connected',
      last_checked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name,
      status: 'unhealthy',
      latency_ms: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
      last_checked: new Date().toISOString(),
    };
  }
}

async function checkEdgeFunctions(): Promise<ServiceStatus> {
  const start = Date.now();
  const name = 'edge_functions';
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    
    // Simple self-check - if we're running, edge functions are working
    const latency = Date.now() - start;
    
    return {
      name,
      status: 'healthy',
      latency_ms: latency,
      message: 'Runtime operational',
      last_checked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name,
      status: 'unhealthy',
      latency_ms: Date.now() - start,
      message: error instanceof Error ? error.message : 'Runtime error',
      last_checked: new Date().toISOString(),
    };
  }
}

async function checkAuth(): Promise<ServiceStatus> {
  const start = Date.now();
  const name = 'authentication';
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check auth service by getting session (should work even without a session)
    const { error } = await supabase.auth.getSession();
    const latency = Date.now() - start;
    
    // getSession returns null session when not logged in, which is expected
    if (error && error.message !== 'Auth session missing!') {
      return {
        name,
        status: 'degraded',
        latency_ms: latency,
        message: error.message,
        last_checked: new Date().toISOString(),
      };
    }
    
    return {
      name,
      status: latency > 1000 ? 'degraded' : 'healthy',
      latency_ms: latency,
      message: 'Service operational',
      last_checked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name,
      status: 'unhealthy',
      latency_ms: Date.now() - start,
      message: error instanceof Error ? error.message : 'Auth service error',
      last_checked: new Date().toISOString(),
    };
  }
}

Deno.serve(async (req) => {
  console.log('[HEALTH] Health check requested');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Run all health checks in parallel
    const [database, stripe, resend, edgeFunctions, auth] = await Promise.all([
      checkDatabase(),
      checkStripe(),
      checkResend(),
      checkEdgeFunctions(),
      checkAuth(),
    ]);

    const services = [database, stripe, resend, edgeFunctions, auth];
    
    const summary = {
      total: services.length,
      healthy: services.filter(s => s.status === 'healthy').length,
      degraded: services.filter(s => s.status === 'degraded').length,
      unhealthy: services.filter(s => s.status === 'unhealthy').length,
    };

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (summary.unhealthy > 0) {
      overallStatus = 'unhealthy';
    } else if (summary.degraded > 0) {
      overallStatus = 'degraded';
    }

    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    const response: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime_seconds: uptimeSeconds,
      services,
      summary,
    };

    console.log('[HEALTH] Check completed', { 
      status: overallStatus, 
      summary 
    });

    // Return appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                       overallStatus === 'degraded' ? 200 : 503;

    return new Response(JSON.stringify(response, null, 2), {
      status: httpStatus,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[HEALTH] Check failed:', error);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      error: error instanceof Error ? error.message : 'Health check failed',
      services: [],
      summary: { total: 0, healthy: 0, degraded: 0, unhealthy: 0 },
    }), {
      status: 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
