import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactEmailRequest = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      console.error("Missing required fields:", { name, email, subject, message });
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Sending contact email from:", email, "Subject:", subject);

    // Send notification email to support team
    const notificationEmail = await resend.emails.send({
      from: "XPEX Neural <onboarding@resend.dev>",
      to: ["support@xpex.dev"],
      replyTo: email,
      subject: `[Contact Form] ${subject}`,
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
            This message was sent via the XPEX Neural contact form.
          </p>
        </div>
      `,
    });

    console.log("Notification email sent:", notificationEmail);

    // Send confirmation email to user
    const confirmationEmail = await resend.emails.send({
      from: "XPEX Neural <onboarding@resend.dev>",
      to: [email],
      subject: "We received your message - XPEX Neural",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #00f5d4;">Thank you for contacting us, ${name}!</h1>
          
          <p style="color: #e0e0e0; line-height: 1.6;">
            We've received your message and will get back to you within 24 hours.
          </p>
          
          <div style="background: #1a1a2e; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #a0a0a0; margin: 0;"><strong style="color: #fff;">Your subject:</strong> ${subject}</p>
          </div>
          
          <p style="color: #e0e0e0; line-height: 1.6;">
            In the meantime, you can explore our <a href="https://xpex.dev/docs" style="color: #00f5d4;">API documentation</a> 
            or check out our <a href="https://xpex.dev/marketplace" style="color: #00f5d4;">API marketplace</a>.
          </p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Best regards,<br>
            The XPEX Neural Team
          </p>
        </div>
      `,
    });

    console.log("Confirmation email sent:", confirmationEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Emails sent successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
