import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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

// Generate HMAC-SHA256 signature
async function generateSignature(
  secret: string,
  timestamp: string,
  body: string
): Promise<string> {
  const encoder = new TextEncoder();
  // Sign: timestamp.body (prevents replay attacks)
  const signedPayload = `${timestamp}.${body}`;
  const keyData = encoder.encode(secret);
  const message = encoder.encode(signedPayload);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, message);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify HMAC-SHA256 signature (for incoming webhooks)
async function verifySignature(
  secret: string,
  signature: string,
  timestamp: string,
  body: string,
  toleranceSeconds: number = 300 // 5 minutes
): Promise<{ valid: boolean; reason?: string }> {
  // Check timestamp to prevent replay attacks
  const webhookTimestamp = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  
  if (isNaN(webhookTimestamp)) {
    return { valid: false, reason: 'Invalid timestamp format' };
  }
  
  if (Math.abs(now - webhookTimestamp) > toleranceSeconds) {
    return { valid: false, reason: 'Timestamp outside tolerance window (possible replay attack)' };
  }
  
  // Generate expected signature
  const expectedSignature = await generateSignature(secret, timestamp, body);
  
  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) {
    return { valid: false, reason: 'Signature length mismatch' };
  }
  
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  
  if (result !== 0) {
    return { valid: false, reason: 'Signature mismatch' };
  }
  
  return { valid: true };
}

// Generate webhook delivery ID for idempotency
function generateDeliveryId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.getRandomValues(new Uint8Array(8));
  const randomHex = Array.from(randomPart).map(b => b.toString(16).padStart(2, '0')).join('');
  return `whd_${timestamp}${randomHex}`;
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
        const deliveryId = generateDeliveryId();
        const timestamp = Math.floor(Date.now() / 1000).toString();
        
        const webhookPayload = {
          id: deliveryId,
          event: event_type,
          timestamp: new Date().toISOString(),
          api_version: '2024-01-01',
          data: payload
        };

        const bodyString = JSON.stringify(webhookPayload);
        
        // Generate HMAC-SHA256 signature
        const signature = await generateSignature(webhook.secret, timestamp, bodyString);
        
        // Format: t=timestamp,v1=signature (similar to Stripe format)
        const signatureHeader = `t=${timestamp},v1=${signature}`;

        try {
          logStep("Sending webhook", { 
            url: webhook.url, 
            event: event_type,
            deliveryId 
          });
          
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'XPEX-Webhook/1.0',
              'X-Webhook-Id': deliveryId,
              'X-Webhook-Signature': signatureHeader,
              'X-Webhook-Timestamp': timestamp,
              'X-Webhook-Event': event_type,
            },
            body: bodyString
          });

          const responseText = await response.text().catch(() => '');
          const success = response.ok;

          // Log the delivery with signature info
          await supabaseClient
            .from('webhook_logs')
            .insert({
              webhook_id: webhook.id,
              event_type,
              payload: {
                ...webhookPayload,
                _delivery: {
                  id: deliveryId,
                  signature_header: signatureHeader,
                  timestamp
                }
              },
              status_code: response.status,
              response: responseText.substring(0, 1000),
              success
            });

          logStep("Webhook sent", { 
            url: webhook.url, 
            status: response.status, 
            success,
            deliveryId
          });

          return { 
            webhook_id: webhook.id, 
            delivery_id: deliveryId,
            success, 
            status: response.status 
          };
        } catch (fetchError) {
          const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
          
          // Log failed delivery
          await supabaseClient
            .from('webhook_logs')
            .insert({
              webhook_id: webhook.id,
              event_type,
              payload: {
                ...webhookPayload,
                _delivery: {
                  id: deliveryId,
                  error: errorMessage
                }
              },
              status_code: null,
              response: errorMessage,
              success: false
            });

          logStep("Webhook failed", { 
            url: webhook.url, 
            error: errorMessage,
            deliveryId 
          });

          return { 
            webhook_id: webhook.id, 
            delivery_id: deliveryId,
            success: false, 
            error: errorMessage 
          };
        }
      })
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        signature_info: {
          algorithm: 'HMAC-SHA256',
          header_format: 't={timestamp},v1={signature}',
          verification_docs: 'https://docs.xpex.dev/webhooks/verification'
        }
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
