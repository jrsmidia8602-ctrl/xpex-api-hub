import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-WEBHOOK] ${step}${detailsStr}`);
};

// Parse signature header (format: t=timestamp,v1=signature)
function parseSignatureHeader(header: string): { timestamp: string; signature: string } | null {
  const parts = header.split(',');
  let timestamp = '';
  let signature = '';
  
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') {
      timestamp = value;
    } else if (key === 'v1') {
      signature = value;
    }
  }
  
  if (!timestamp || !signature) {
    return null;
  }
  
  return { timestamp, signature };
}

// Generate HMAC-SHA256 signature for verification
async function generateSignature(
  secret: string,
  timestamp: string,
  body: string
): Promise<string> {
  const encoder = new TextEncoder();
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

// Constant-time string comparison to prevent timing attacks
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

interface VerifyRequest {
  signature_header: string;
  body: string;
  secret: string;
  tolerance_seconds?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Verification request received");
    
    const request: VerifyRequest = await req.json();
    const { signature_header, body, secret, tolerance_seconds = 300 } = request;
    
    if (!signature_header || !body || !secret) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Missing required fields: signature_header, body, secret' 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Parse the signature header
    const parsed = parseSignatureHeader(signature_header);
    
    if (!parsed) {
      logStep("Invalid signature header format");
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Invalid signature header format. Expected: t={timestamp},v1={signature}' 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { timestamp, signature } = parsed;
    
    // Check timestamp to prevent replay attacks
    const webhookTimestamp = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    
    if (isNaN(webhookTimestamp)) {
      logStep("Invalid timestamp");
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Invalid timestamp in signature header' 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    const timeDiff = Math.abs(now - webhookTimestamp);
    
    if (timeDiff > tolerance_seconds) {
      logStep("Timestamp outside tolerance", { 
        webhookTimestamp, 
        now, 
        diff: timeDiff,
        tolerance: tolerance_seconds 
      });
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: `Timestamp outside tolerance window (${timeDiff}s > ${tolerance_seconds}s). Possible replay attack.`,
          details: {
            webhook_timestamp: webhookTimestamp,
            server_timestamp: now,
            difference_seconds: timeDiff,
            tolerance_seconds
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Generate expected signature
    const expectedSignature = await generateSignature(secret, timestamp, body);
    
    // Secure comparison
    const isValid = secureCompare(signature, expectedSignature);
    
    logStep("Verification complete", { valid: isValid });

    if (!isValid) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Signature verification failed. The signature does not match the expected value.' 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ 
        valid: true,
        message: 'Webhook signature verified successfully',
        details: {
          timestamp: new Date(webhookTimestamp * 1000).toISOString(),
          age_seconds: timeDiff
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ valid: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
