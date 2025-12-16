import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Em modo de teste do Resend, o único remetente garantido é onboarding@resend.dev
// e o destinatário precisa ser um email permitido/validado na conta.
const RESEND_TEST_FROM = "XPEX Neural <onboarding@resend.dev>";
const RESEND_TEST_TO = "xpexneural@gmail.com";

async function sendEmail(params: {
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!RESEND_API_KEY) {
    console.error("[SEND-EMAIL] Missing RESEND_API_KEY env var");
    throw new Error("RESEND_API_KEY is not configured");
  }

  console.log("[SEND-EMAIL] Sending", {
    from: RESEND_TEST_FROM,
    to: params.to,
    subject: params.subject,
    hasReplyTo: Boolean(params.replyTo),
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_TEST_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      reply_to: params.replyTo,
    }),
  });

  const text = await response.text();

  if (!response.ok) {
    console.error("[SEND-EMAIL] Resend error", {
      status: response.status,
      body: text,
    });
    throw new Error(`Failed to send email: ${text}`);
  }

  console.log("[SEND-EMAIL] Resend success", text);
  return JSON.parse(text);
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[CONTACT-EMAIL] invoked", { method: req.method });

    const body = (await req.json()) as Partial<ContactEmailRequest>;
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!name || !email || !subject || !message) {
      console.error("[CONTACT-EMAIL] Missing required fields", {
        name: Boolean(name),
        email: Boolean(email),
        subject: Boolean(subject),
        message: Boolean(message),
      });
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Modo teste: envia tudo para o email permitido/validado (RESEND_TEST_TO)
    // e usa reply_to para você responder direto ao usuário.
    const notificationResult = await sendEmail({
      to: [RESEND_TEST_TO],
      subject: `[Contact Form] ${subject}`,
      replyTo: email,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #00f5d4; border-bottom: 2px solid #00f5d4; padding-bottom: 10px;">New Contact Form Submission</h2>
          <div style="background: #1a1a2e; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px; color: #a0a0a0;"><strong style="color: #fff;">From:</strong> ${name}</p>
            <p style="margin: 0 0 10px; color: #a0a0a0;"><strong style="color: #fff;">Email:</strong> ${email}</p>
            <p style="margin: 0; color: #a0a0a0;"><strong style="color: #fff;">Subject:</strong> ${subject}</p>
          </div>
          <div style="background: #16213e; padding: 20px; border-radius: 8px; border-left: 4px solid #00f5d4;">
            <h3 style="color: #fff; margin-top: 0;">Message:</h3>
            <p style="color: #e0e0e0; white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Reply directly to this email to respond to ${email}
          </p>
        </div>
      `,
    });

    console.log("[CONTACT-EMAIL] Notification sent", notificationResult);

    // Sucesso sempre 200
    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Mensagem recebida com sucesso. (Modo teste: enviada para o email verificado no Resend.)",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CONTACT-EMAIL] Error", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
