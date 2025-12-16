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

// Email autenticado no Resend (modo de teste)
const RESEND_VERIFIED_EMAIL = "xpexneural@gmail.com";

async function sendEmail(to: string[], subject: string, html: string, replyTo?: string) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  console.log("[SEND-EMAIL] Checking RESEND_API_KEY...");
  
  if (!RESEND_API_KEY) {
    console.error("[SEND-EMAIL] RESEND_API_KEY is not configured");
    throw new Error("RESEND_API_KEY is not configured");
  }

  console.log("[SEND-EMAIL] Sending email to:", to, "Subject:", subject);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `XPEX Neural <${RESEND_VERIFIED_EMAIL}>`,
      to,
      subject,
      html,
      reply_to: replyTo,
    }),
  });

  const responseText = await response.text();
  
  if (!response.ok) {
    console.error("[SEND-EMAIL] Resend API error:", response.status, responseText);
    throw new Error(`Failed to send email: ${responseText}`);
  }

  console.log("[SEND-EMAIL] Email sent successfully:", responseText);
  return JSON.parse(responseText);
}

serve(async (req: Request): Promise<Response> => {
  console.log("[CONTACT-EMAIL] Function invoked, method:", req.method);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("[CONTACT-EMAIL] Handling CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("[CONTACT-EMAIL] Request body received:", JSON.stringify(body));
    
    const { name, email, subject, message }: ContactEmailRequest = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      console.error("[CONTACT-EMAIL] Missing required fields:", { name, email, subject, message });
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("[CONTACT-EMAIL] Processing contact from:", email, "Subject:", subject);

    // Em modo de teste do Resend, só podemos enviar para o email verificado
    // Enviamos notificação para o email verificado (xpexneural@gmail.com)
    const notificationResult = await sendEmail(
      [RESEND_VERIFIED_EMAIL], // Destinatário é o email verificado
      `[Contact Form] ${subject}`,
      `
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
            This message was sent via the XPEX Neural contact form.<br>
            Reply directly to this email to respond to ${email}
          </p>
        </div>
      `,
      email // Reply-to é o email do usuário
    );

    console.log("[CONTACT-EMAIL] Notification email sent successfully:", notificationResult);

    // Nota: Email de confirmação para o usuário desabilitado até verificar domínio no Resend
    // Quando domínio for verificado, descomentar o código abaixo e atualizar o from address

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Contact form submitted successfully. We'll get back to you soon!" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[CONTACT-EMAIL] Error:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});