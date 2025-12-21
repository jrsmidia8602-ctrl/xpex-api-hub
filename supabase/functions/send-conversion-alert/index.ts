import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertPayload {
  type: "email" | "slack";
  recipient: string; // Email address or Slack webhook URL
  alert: {
    eventName: string;
    message: string;
    severity: "warning" | "critical";
    currentValue: number;
    threshold: number;
    createdAt: string;
  };
}

const RESEND_FROM = "XPEX Alerts <onboarding@resend.dev>";

async function sendEmail(params: {
  to: string[];
  subject: string;
  html: string;
}) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!RESEND_API_KEY) {
    console.error("[SEND-ALERT] Missing RESEND_API_KEY env var");
    throw new Error("RESEND_API_KEY is not configured");
  }

  console.log("[SEND-ALERT] Sending email", {
    from: RESEND_FROM,
    to: params.to,
    subject: params.subject,
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  const text = await response.text();

  if (!response.ok) {
    console.error("[SEND-ALERT] Resend error", {
      status: response.status,
      body: text,
    });
    throw new Error(`Failed to send email: ${text}`);
  }

  console.log("[SEND-ALERT] Resend success", text);
  return JSON.parse(text);
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AlertPayload = await req.json();
    console.log("[SEND-ALERT] Processing alert notification:", payload);

    const { type, recipient, alert } = payload;

    if (type === "email") {
      const severityColor = alert.severity === "critical" ? "#dc2626" : "#f59e0b";
      const severityLabel = alert.severity === "critical" ? "CRÍTICO" : "ALERTA";
      
      const emailResult = await sendEmail({
        to: [recipient],
        subject: `[${severityLabel}] Alerta de Conversão: ${alert.eventName.replace(/_/g, " ")}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
              .severity-badge { background: ${severityColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; }
              .event-name { font-size: 18px; font-weight: 600; color: #18181b; text-transform: capitalize; }
              .message { font-size: 14px; color: #52525b; margin-bottom: 20px; line-height: 1.6; }
              .metrics { margin-bottom: 20px; }
              .metric { display: inline-block; margin-right: 24px; }
              .metric-label { font-size: 12px; color: #71717a; margin-bottom: 4px; }
              .metric-value { font-size: 24px; font-weight: 700; color: #18181b; }
              .metric-value.current { color: ${severityColor}; }
              .footer { text-align: center; font-size: 12px; color: #a1a1aa; margin-top: 20px; }
              .timestamp { font-size: 12px; color: #a1a1aa; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <span class="severity-badge">${severityLabel}</span>
                </div>
                <div class="event-name">${alert.eventName.replace(/_/g, " ")}</div>
                <div class="message">${alert.message}</div>
                <div class="metrics">
                  <div class="metric">
                    <div class="metric-label">Valor Atual</div>
                    <div class="metric-value current">${alert.currentValue}</div>
                  </div>
                  <div class="metric">
                    <div class="metric-label">Limite Mínimo</div>
                    <div class="metric-value">${alert.threshold}</div>
                  </div>
                </div>
                <div class="timestamp">Data: ${new Date(alert.createdAt).toLocaleString("pt-BR")}</div>
              </div>
              <div class="footer">
                <p>Este é um alerta automático do sistema XPEX Analytics</p>
                <p>Para gerenciar seus alertas, acesse o painel de administração</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      return new Response(
        JSON.stringify({ success: true, type: "email", response: emailResult }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } 
    
    if (type === "slack") {
      // Send Slack webhook
      const severityEmoji = alert.severity === "critical" ? "🚨" : "⚠️";
      const severityColor = alert.severity === "critical" ? "#dc2626" : "#f59e0b";
      
      const slackPayload = {
        attachments: [
          {
            color: severityColor,
            blocks: [
              {
                type: "header",
                text: {
                  type: "plain_text",
                  text: `${severityEmoji} Alerta de Conversão`,
                  emoji: true,
                },
              },
              {
                type: "section",
                fields: [
                  {
                    type: "mrkdwn",
                    text: `*Evento:*\n${alert.eventName.replace(/_/g, " ")}`,
                  },
                  {
                    type: "mrkdwn",
                    text: `*Severidade:*\n${alert.severity === "critical" ? "Crítico" : "Alerta"}`,
                  },
                ],
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: alert.message,
                },
              },
              {
                type: "section",
                fields: [
                  {
                    type: "mrkdwn",
                    text: `*Valor Atual:*\n${alert.currentValue}`,
                  },
                  {
                    type: "mrkdwn",
                    text: `*Limite Mínimo:*\n${alert.threshold}`,
                  },
                ],
              },
              {
                type: "context",
                elements: [
                  {
                    type: "mrkdwn",
                    text: `📅 ${new Date(alert.createdAt).toLocaleString("pt-BR")}`,
                  },
                ],
              },
            ],
          },
        ],
      };

      console.log("[SEND-ALERT] Sending Slack webhook to:", recipient);
      
      const slackResponse = await fetch(recipient, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackPayload),
      });

      if (!slackResponse.ok) {
        const errorText = await slackResponse.text();
        console.error("[SEND-ALERT] Slack webhook error:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to send Slack notification", details: errorText }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log("[SEND-ALERT] Slack notification sent successfully");

      return new Response(
        JSON.stringify({ success: true, type: "slack" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid notification type" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[SEND-ALERT] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
