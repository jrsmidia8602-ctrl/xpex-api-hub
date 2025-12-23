import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookStats {
  total_sent: number;
  successful: number;
  failed: number;
  success_rate: number;
  avg_response_time: number;
  by_event_type: Record<string, { total: number; success: number; failed: number }>;
}

interface UserWebhookData {
  user_id: string;
  email: string;
  full_name: string | null;
  webhooks: Array<{
    id: string;
    name: string;
    url: string;
  }>;
  stats: WebhookStats;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Weekly webhook report triggered");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    console.log(`Generating report for period: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Get all users with webhooks who have weekly_reports enabled
    const { data: usersWithPrefs, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('weekly_reports', true)
      .eq('email_enabled', true);

    if (prefsError) {
      console.error('Error fetching notification preferences:', prefsError);
      throw prefsError;
    }

    if (!usersWithPrefs || usersWithPrefs.length === 0) {
      console.log('No users with weekly reports enabled');
      return new Response(JSON.stringify({ message: 'No users to send reports to' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = usersWithPrefs.map(u => u.user_id);
    console.log(`Found ${userIds.length} users with weekly reports enabled`);

    // Get webhooks for these users
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('id, name, url, user_id')
      .in('user_id', userIds);

    if (webhooksError) {
      console.error('Error fetching webhooks:', webhooksError);
      throw webhooksError;
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('No webhooks found for these users');
      return new Response(JSON.stringify({ message: 'No webhooks to report on' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookIds = webhooks.map(w => w.id);

    // Get webhook logs for the period
    const { data: logs, error: logsError } = await supabase
      .from('webhook_logs')
      .select('*')
      .in('webhook_id', webhookIds)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (logsError) {
      console.error('Error fetching webhook logs:', logsError);
      throw logsError;
    }

    // Get user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    // Build user data with stats
    const userDataMap = new Map<string, UserWebhookData>();

    for (const profile of profiles || []) {
      if (!profile.email) continue;

      const userWebhooks = webhooks.filter(w => w.user_id === profile.user_id);
      if (userWebhooks.length === 0) continue;

      const userWebhookIds = userWebhooks.map(w => w.id);
      const userLogs = (logs || []).filter(l => userWebhookIds.includes(l.webhook_id));

      const stats: WebhookStats = {
        total_sent: userLogs.length,
        successful: userLogs.filter(l => l.success).length,
        failed: userLogs.filter(l => !l.success).length,
        success_rate: userLogs.length > 0 
          ? Math.round((userLogs.filter(l => l.success).length / userLogs.length) * 100) 
          : 100,
        avg_response_time: 0,
        by_event_type: {},
      };

      // Calculate by event type
      for (const log of userLogs) {
        if (!stats.by_event_type[log.event_type]) {
          stats.by_event_type[log.event_type] = { total: 0, success: 0, failed: 0 };
        }
        stats.by_event_type[log.event_type].total++;
        if (log.success) {
          stats.by_event_type[log.event_type].success++;
        } else {
          stats.by_event_type[log.event_type].failed++;
        }
      }

      userDataMap.set(profile.user_id, {
        user_id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        webhooks: userWebhooks,
        stats,
      });
    }

    console.log(`Sending reports to ${userDataMap.size} users`);

    // Send emails
    let sentCount = 0;
    let errorCount = 0;

    for (const userData of userDataMap.values()) {
      try {
        const emailHtml = generateReportEmail(userData, startDate, endDate);
        
        await resend.emails.send({
          from: "XPEX Neural <noreply@xpex.com.br>",
          to: [userData.email],
          subject: `📊 Relatório Semanal de Webhooks - ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`,
          html: emailHtml,
        });

        console.log(`Report sent to ${userData.email}`);
        sentCount++;
      } catch (emailError) {
        console.error(`Error sending email to ${userData.email}:`, emailError);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reports_sent: sentCount,
        errors: errorCount,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error generating weekly report:", error);
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

function generateReportEmail(userData: UserWebhookData, startDate: Date, endDate: Date): string {
  const { stats, webhooks, full_name } = userData;
  const greeting = full_name ? `Olá, ${full_name.split(' ')[0]}!` : 'Olá!';

  const eventTypesRows = Object.entries(stats.by_event_type)
    .map(([eventType, data]) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${eventType}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${data.total}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center; color: #22c55e;">${data.success}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center; color: #ef4444;">${data.failed}</td>
      </tr>
    `)
    .join('');

  const webhooksList = webhooks
    .map(w => `<li style="margin-bottom: 4px;">${w.name}</li>`)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📊 Relatório Semanal</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px;">
            ${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">${greeting}</p>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
            Aqui está o resumo de performance dos seus webhooks na última semana:
          </p>

          <!-- Stats Cards -->
          <div style="display: flex; gap: 12px; margin-bottom: 24px;">
            <div style="flex: 1; background-color: #f0fdf4; border-radius: 8px; padding: 16px; text-align: center;">
              <p style="color: #16a34a; font-size: 28px; font-weight: bold; margin: 0;">${stats.total_sent}</p>
              <p style="color: #15803d; font-size: 12px; margin: 4px 0 0 0;">Total Enviados</p>
            </div>
            <div style="flex: 1; background-color: #f0fdf4; border-radius: 8px; padding: 16px; text-align: center;">
              <p style="color: #16a34a; font-size: 28px; font-weight: bold; margin: 0;">${stats.success_rate}%</p>
              <p style="color: #15803d; font-size: 12px; margin: 4px 0 0 0;">Taxa de Sucesso</p>
            </div>
            <div style="flex: 1; background-color: ${stats.failed > 0 ? '#fef2f2' : '#f0fdf4'}; border-radius: 8px; padding: 16px; text-align: center;">
              <p style="color: ${stats.failed > 0 ? '#dc2626' : '#16a34a'}; font-size: 28px; font-weight: bold; margin: 0;">${stats.failed}</p>
              <p style="color: ${stats.failed > 0 ? '#b91c1c' : '#15803d'}; font-size: 12px; margin: 4px 0 0 0;">Falhas</p>
            </div>
          </div>

          ${Object.keys(stats.by_event_type).length > 0 ? `
          <!-- Event Types Table -->
          <h3 style="color: #374151; font-size: 16px; margin: 0 0 12px 0;">Detalhamento por Evento</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Evento</th>
                <th style="padding: 8px 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Total</th>
                <th style="padding: 8px 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Sucesso</th>
                <th style="padding: 8px 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Falhas</th>
              </tr>
            </thead>
            <tbody>
              ${eventTypesRows}
            </tbody>
          </table>
          ` : ''}

          <!-- Webhooks List -->
          <h3 style="color: #374151; font-size: 16px; margin: 0 0 12px 0;">Webhooks Monitorados</h3>
          <ul style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0; padding-left: 20px;">
            ${webhooksList}
          </ul>

          ${stats.failed > 0 ? `
          <!-- Alert -->
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #dc2626; font-size: 14px; margin: 0;">
              ⚠️ <strong>Atenção:</strong> ${stats.failed} webhook(s) falharam na última semana. 
              Verifique os logs no painel para mais detalhes.
            </p>
          </div>
          ` : `
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #16a34a; font-size: 14px; margin: 0;">
              ✅ <strong>Excelente!</strong> Todos os webhooks foram entregues com sucesso na última semana.
            </p>
          </div>
          `}

          <!-- CTA Button -->
          <div style="text-align: center; margin-top: 24px;">
            <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || '#'}/dashboard" 
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
              Ver Painel Completo
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Você está recebendo este email porque ativou os relatórios semanais nas suas preferências de notificação.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
            © ${new Date().getFullYear()} XPEX Neural. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
