import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: NewsletterRequest = await req.json();

    if (!email || !email.includes("@")) {
      console.error("Invalid email provided:", email);
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Processing newsletter subscription for:", email);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, unsubscribed_at")
      .eq("email", email.toLowerCase())
      .single();

    if (existing && !existing.unsubscribed_at) {
      console.log("Email already subscribed:", email);
      return new Response(
        JSON.stringify({ message: "Already subscribed", alreadySubscribed: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Insert or update subscriber
    const { error: dbError } = await supabase
      .from("newsletter_subscribers")
      .upsert({
        email: email.toLowerCase(),
        subscribed_at: new Date().toISOString(),
        confirmed: true,
        unsubscribed_at: null,
      }, { onConflict: "email" });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to save subscription");
    }

    console.log("Subscriber saved to database:", email);

    // Send confirmation email via Resend
    // Note: In testing mode, emails can only be sent to verified addresses
    // For production, verify your domain at resend.com/domains
    const RESEND_TEST_TO = "xpexneural@gmail.com";
    
    const emailResponse = await resend.emails.send({
      from: "XPEX Neural <onboarding@resend.dev>",
      to: [RESEND_TEST_TO], // In production with verified domain: [email]
      reply_to: email,
      subject: "Welcome to XPEX Neural Newsletter! 🚀",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; border: 1px solid rgba(0, 255, 255, 0.2);">
                  <tr>
                    <td style="padding: 40px;">
                      <!-- Logo -->
                      <div style="text-align: center; margin-bottom: 30px;">
                        <span style="font-size: 28px; font-weight: bold; color: #00ffff;">⚡ XPEX Neural</span>
                      </div>
                      
                      <!-- Main Content -->
                      <h1 style="color: #ffffff; font-size: 24px; margin-bottom: 20px; text-align: center;">
                        Welcome to the Agent Economy! 🎉
                      </h1>
                      
                      <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                        Thank you for subscribing to the XPEX Neural newsletter! You're now part of an exclusive community at the forefront of the API and AI agent revolution.
                      </p>
                      
                      <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                        Here's what you can expect:
                      </p>
                      
                      <ul style="color: #a0a0a0; font-size: 16px; line-height: 1.8; margin-bottom: 30px; padding-left: 20px;">
                        <li>🔥 New API launches and feature updates</li>
                        <li>📊 Insights on the agent economy and AI trends</li>
                        <li>💡 Tips for maximizing your API integrations</li>
                        <li>🎁 Exclusive offers and early access opportunities</li>
                      </ul>
                      
                      <!-- CTA Button -->
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="https://xpex.dev/marketplace" style="display: inline-block; background: linear-gradient(135deg, #00ffff 0%, #00cccc 100%); color: #000000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                          Explore Our APIs
                        </a>
                      </div>
                      
                      <p style="color: #666666; font-size: 14px; text-align: center; margin-top: 30px;">
                        Subscriber email: ${email}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px; border-top: 1px solid rgba(255,255,255,0.1);">
                      <p style="color: #666666; font-size: 12px; text-align: center; margin: 0;">
                        © ${new Date().getFullYear()} XPEX Neural. All rights reserved.<br>
                        <a href="https://xpex.dev/legal/privacy" style="color: #00ffff; text-decoration: none;">Privacy Policy</a> | 
                        <a href="https://xpex.dev/legal/terms" style="color: #00ffff; text-decoration: none;">Terms of Service</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Confirmation email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Successfully subscribed to newsletter",
        emailSent: true 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in newsletter-subscribe function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to subscribe" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
