import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-USAGE-ALERTS] ${step}${detailsStr}`);
};

const PLAN_LIMITS = {
  free: 1000,
  pro: 20000,
  enterprise: -1 // unlimited
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const resend = resendApiKey ? new Resend(resendApiKey) : null;

  try {
    logStep("Function started");

    // Get all profiles with their subscription info
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, user_id, email, full_name, subscription_tier');

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }

    logStep("Fetched profiles", { count: profiles?.length });

    const alerts: Array<{ userId: string; email: string; usage: number; limit: number; percentage: number }> = [];

    for (const profile of profiles || []) {
      const tier = (profile.subscription_tier || 'free') as keyof typeof PLAN_LIMITS;
      const limit = PLAN_LIMITS[tier];

      // Skip unlimited plans
      if (limit === -1) continue;

      // Get current month usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count, error: usageError } = await supabaseClient
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.user_id)
        .gte('created_at', startOfMonth.toISOString());

      if (usageError) {
        logStep("Error fetching usage", { userId: profile.user_id, error: usageError.message });
        continue;
      }

      const usage = count || 0;
      const percentage = Math.round((usage / limit) * 100);

      logStep("User usage checked", { 
        userId: profile.user_id, 
        usage, 
        limit, 
        percentage,
        tier 
      });

      // Check if usage is at 80% or higher
      if (percentage >= 80 && profile.email) {
        alerts.push({
          userId: profile.user_id,
          email: profile.email,
          usage,
          limit,
          percentage
        });
      }
    }

    logStep("Alerts to send", { count: alerts.length });

    // Send emails and trigger webhooks for each alert
    const results = await Promise.all(
      alerts.map(async (alert) => {
        const alertType = alert.percentage >= 100 ? 'usage.limit_reached' : 'usage.threshold';
        
        // Send webhook notification
        try {
          const webhookResponse = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-webhook`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
              },
              body: JSON.stringify({
                user_id: alert.userId,
                event_type: alertType,
                payload: {
                  usage: alert.usage,
                  limit: alert.limit,
                  percentage: alert.percentage,
                  message: alert.percentage >= 100 
                    ? 'Você atingiu o limite de uso mensal!' 
                    : `Você atingiu ${alert.percentage}% do seu limite mensal.`
                }
              })
            }
          );

          logStep("Webhook sent", { 
            userId: alert.userId, 
            status: webhookResponse.status 
          });
        } catch (webhookError) {
          logStep("Webhook error", { 
            userId: alert.userId, 
            error: webhookError instanceof Error ? webhookError.message : 'Unknown error' 
          });
        }

        // Send email notification
        if (resend && alert.email) {
          try {
            const emailSubject = alert.percentage >= 100
              ? '⚠️ Limite de uso atingido - XPEX AI'
              : `📊 Alerta: ${alert.percentage}% do limite usado - XPEX AI`;

            const emailHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #ffffff; padding: 40px; }
                  .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; padding: 40px; border: 1px solid #2d2d44; }
                  .header { text-align: center; margin-bottom: 30px; }
                  .logo { font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #a855f7, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                  .alert-box { background: ${alert.percentage >= 100 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)'}; border: 1px solid ${alert.percentage >= 100 ? '#ef4444' : '#eab308'}; border-radius: 12px; padding: 24px; margin: 20px 0; }
                  .progress-bar { background: #2d2d44; border-radius: 8px; height: 12px; overflow: hidden; margin: 16px 0; }
                  .progress-fill { height: 100%; background: ${alert.percentage >= 100 ? '#ef4444' : alert.percentage >= 90 ? '#f97316' : '#eab308'}; width: ${Math.min(alert.percentage, 100)}%; transition: width 0.3s; }
                  .stats { display: flex; justify-content: space-between; margin: 20px 0; }
                  .stat { text-align: center; }
                  .stat-value { font-size: 24px; font-weight: bold; color: #a855f7; }
                  .stat-label { font-size: 12px; color: #9ca3af; }
                  .cta { display: inline-block; background: linear-gradient(135deg, #a855f7, #06b6d4); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
                  .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #2d2d44; color: #6b7280; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <div class="logo">XPEX AI</div>
                  </div>
                  
                  <div class="alert-box">
                    <h2 style="margin: 0 0 10px 0; color: ${alert.percentage >= 100 ? '#ef4444' : '#eab308'}">
                      ${alert.percentage >= 100 ? '⚠️ Limite Atingido!' : '📊 Alerta de Uso'}
                    </h2>
                    <p style="margin: 0; color: #d1d5db;">
                      ${alert.percentage >= 100 
                        ? 'Você atingiu 100% do seu limite mensal de chamadas API.' 
                        : `Você está usando ${alert.percentage}% do seu limite mensal.`}
                    </p>
                  </div>

                  <div class="progress-bar">
                    <div class="progress-fill"></div>
                  </div>

                  <div class="stats">
                    <div class="stat">
                      <div class="stat-value">${alert.usage.toLocaleString()}</div>
                      <div class="stat-label">Chamadas usadas</div>
                    </div>
                    <div class="stat">
                      <div class="stat-value">${alert.limit.toLocaleString()}</div>
                      <div class="stat-label">Limite mensal</div>
                    </div>
                    <div class="stat">
                      <div class="stat-value">${alert.percentage}%</div>
                      <div class="stat-label">Utilizado</div>
                    </div>
                  </div>

                  <p style="color: #9ca3af; line-height: 1.6;">
                    ${alert.percentage >= 100 
                      ? 'Para continuar usando nossas APIs sem interrupções, considere fazer upgrade do seu plano ou comprar créditos adicionais.' 
                      : 'Recomendamos monitorar seu uso ou considerar um upgrade de plano para evitar interrupções.'}
                  </p>

                  <div style="text-align: center;">
                    <a href="https://xpex.ai/pricing" class="cta">Ver Planos</a>
                  </div>

                  <div class="footer">
                    <p>© ${new Date().getFullYear()} XPEX AI. Todos os direitos reservados.</p>
                    <p>Este email foi enviado automaticamente pelo sistema de alertas.</p>
                  </div>
                </div>
              </body>
              </html>
            `;

            await resend.emails.send({
              from: 'XPEX AI <alerts@resend.dev>',
              to: [alert.email],
              subject: emailSubject,
              html: emailHtml
            });

            logStep("Email sent", { email: alert.email, percentage: alert.percentage });
            return { userId: alert.userId, email: alert.email, success: true };
          } catch (emailError) {
            logStep("Email error", { 
              email: alert.email, 
              error: emailError instanceof Error ? emailError.message : 'Unknown error' 
            });
            return { userId: alert.userId, email: alert.email, success: false, error: emailError };
          }
        }

        return { userId: alert.userId, webhookOnly: true };
      })
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsProcessed: alerts.length,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
