import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertData {
  user_id: string;
  email: string;
  alert_type: 'latency' | 'error_rate';
  current_value: number;
  threshold_value: number;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Checking metrics alerts...");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all enabled alert thresholds
    const { data: thresholds, error: thresholdsError } = await supabase
      .from('alert_thresholds')
      .select('*')
      .eq('enabled', true);

    if (thresholdsError) {
      console.error('Error fetching thresholds:', thresholdsError);
      throw thresholdsError;
    }

    if (!thresholds || thresholds.length === 0) {
      console.log('No enabled alert thresholds found');
      return new Response(JSON.stringify({ message: 'No thresholds to check' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const alertsToSend: AlertData[] = [];
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    for (const threshold of thresholds) {
      // Skip if alert was sent recently (within 30 minutes)
      if (threshold.last_alert_at) {
        const lastAlert = new Date(threshold.last_alert_at);
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
        if (lastAlert > thirtyMinutesAgo) {
          console.log(`Skipping user ${threshold.user_id} - alert sent recently`);
          continue;
        }
      }

      // Get recent logs for this user (last 5 minutes)
      const { data: logs, error: logsError } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('user_id', threshold.user_id)
        .gte('created_at', fiveMinutesAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) {
        console.error(`Error fetching logs for user ${threshold.user_id}:`, logsError);
        continue;
      }

      if (!logs || logs.length < 5) {
        // Not enough data to make a decision
        continue;
      }

      // Calculate metrics
      const errorCount = logs.filter(l => l.status_code >= 400).length;
      const errorRate = (errorCount / logs.length) * 100;
      
      const responseTimes = logs
        .filter(l => l.response_time_ms)
        .map(l => l.response_time_ms!);
      const avgLatency = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      // Get user profile for email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', threshold.user_id)
        .single();

      if (!profile?.email) continue;

      // Check notification preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', threshold.user_id)
        .single();

      if (!prefs?.email_enabled || !prefs?.usage_alerts) continue;

      // Check thresholds
      if (avgLatency > threshold.latency_threshold_ms) {
        alertsToSend.push({
          user_id: threshold.user_id,
          email: profile.email,
          alert_type: 'latency',
          current_value: avgLatency,
          threshold_value: threshold.latency_threshold_ms,
        });
      } else if (errorRate > threshold.error_rate_threshold) {
        alertsToSend.push({
          user_id: threshold.user_id,
          email: profile.email,
          alert_type: 'error_rate',
          current_value: errorRate,
          threshold_value: threshold.error_rate_threshold,
        });
      }
    }

    console.log(`Sending ${alertsToSend.length} alerts`);

    let sentCount = 0;
    for (const alert of alertsToSend) {
      try {
        const alertTitle = alert.alert_type === 'latency' 
          ? 'Alerta de Latência Alta' 
          : 'Alerta de Taxa de Erro Alta';
        
        const alertMessage = alert.alert_type === 'latency'
          ? `A latência média está em ${alert.current_value.toFixed(0)}ms, acima do limite de ${alert.threshold_value}ms.`
          : `A taxa de erro está em ${alert.current_value.toFixed(1)}%, acima do limite de ${alert.threshold_value}%.`;

        await resend.emails.send({
          from: "XPEX Neural <noreply@xpex.com.br>",
          to: [alert.email],
          subject: `⚠️ ${alertTitle}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: sans-serif; background: #f9fafb; padding: 20px;">
              <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; border-left: 4px solid #ef4444;">
                <h2 style="color: #dc2626; margin: 0 0 16px;">⚠️ ${alertTitle}</h2>
                <p style="color: #6b7280;">${alertMessage}</p>
                <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p style="margin: 0;"><strong>Valor Atual:</strong> ${alert.alert_type === 'latency' ? alert.current_value.toFixed(0) + 'ms' : alert.current_value.toFixed(1) + '%'}</p>
                  <p style="margin: 8px 0 0;"><strong>Limite Configurado:</strong> ${alert.alert_type === 'latency' ? alert.threshold_value + 'ms' : alert.threshold_value + '%'}</p>
                </div>
                <p style="color: #6b7280; font-size: 12px;">Você pode ajustar os limites de alerta no painel de configurações.</p>
              </div>
            </body>
            </html>
          `,
        });

        // Update last_alert_at
        await supabase
          .from('alert_thresholds')
          .update({ last_alert_at: new Date().toISOString() })
          .eq('user_id', alert.user_id);

        // Create in-app notification
        await supabase
          .from('notifications')
          .insert({
            user_id: alert.user_id,
            title: alertTitle,
            message: alertMessage,
            type: 'warning',
            action_url: '/dashboard',
          });

        sentCount++;
        console.log(`Alert sent to ${alert.email}`);
      } catch (emailError) {
        console.error(`Error sending alert to ${alert.email}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        alerts_checked: thresholds.length,
        alerts_sent: sentCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error checking metrics alerts:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
