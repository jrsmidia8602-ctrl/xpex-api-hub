import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { encode as encodeHex } from "https://deno.land/std@0.190.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-WEBHOOK] ${step}${detailsStr}`);
};

interface WebhookPayload {
  webhook_id?: string;
  user_id?: string;
  event_type: string;
  payload: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");
    
    const body: WebhookPayload = await req.json();
    const { webhook_id, user_id, event_type, payload } = body;
    
    logStep("Received request", { webhook_id, user_id, event_type });

    let webhooksToSend: Array<{ id: string; url: string; secret: string; events: string[] }> = [];

    if (webhook_id) {
      // Send to specific webhook (for testing)
      const { data: webhook, error } = await supabaseClient
        .from('webhooks')
        .select('id, url, secret, events')
        .eq('id', webhook_id)
        .eq('active', true)
        .single();

      if (error || !webhook) {
        throw new Error('Webhook not found or inactive');
      }

      webhooksToSend = [webhook];
    } else if (user_id) {
      // Send to all active webhooks for user that match the event
      const { data: webhooks, error } = await supabaseClient
        .from('webhooks')
        .select('id, url, secret, events')
        .eq('user_id', user_id)
        .eq('active', true);

      if (error) {
        throw new Error(`Error fetching webhooks: ${error.message}`);
      }

      webhooksToSend = (webhooks || []).filter(w => 
        w.events.includes(event_type) || event_type === 'test'
      );
    }

    logStep("Webhooks to send", { count: webhooksToSend.length });

    const results = await Promise.all(
      webhooksToSend.map(async (webhook) => {
        const webhookPayload = {
          event: event_type,
          timestamp: new Date().toISOString(),
          data: payload
        };

        // Create HMAC signature using Web Crypto API
        const encoder = new TextEncoder();
        const keyData = encoder.encode(webhook.secret);
        const message = encoder.encode(JSON.stringify(webhookPayload));
        const cryptoKey = await crypto.subtle.importKey(
          "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
        );
        const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, message);
        const signature = Array.from(new Uint8Array(signatureBuffer))
          .map(b => b.toString(16).padStart(2, '0')).join('');

        try {
          logStep("Sending webhook", { url: webhook.url, event: event_type });
          
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': signature,
              'X-Webhook-Event': event_type,
              'X-Webhook-Timestamp': new Date().toISOString()
            },
            body: JSON.stringify(webhookPayload)
          });

          const responseText = await response.text().catch(() => '');
          const success = response.ok;

          // Log the delivery
          await supabaseClient
            .from('webhook_logs')
            .insert({
              webhook_id: webhook.id,
              event_type,
              payload: webhookPayload,
              status_code: response.status,
              response: responseText.substring(0, 1000),
              success
            });

          logStep("Webhook sent", { 
            url: webhook.url, 
            status: response.status, 
            success 
          });

          return { webhook_id: webhook.id, success, status: response.status };
        } catch (fetchError) {
          const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
          
          // Log failed delivery
          await supabaseClient
            .from('webhook_logs')
            .insert({
              webhook_id: webhook.id,
              event_type,
              payload: webhookPayload,
              status_code: null,
              response: errorMessage,
              success: false
            });

          logStep("Webhook failed", { url: webhook.url, error: errorMessage });

          return { webhook_id: webhook.id, success: false, error: errorMessage };
        }
      })
    );

    return new Response(
      JSON.stringify({ success: true, results }),
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
