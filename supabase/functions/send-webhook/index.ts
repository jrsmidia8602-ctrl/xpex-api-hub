import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-WEBHOOK] ${step}${detailsStr}`);
};

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 5,
  baseDelayMs: 1000, // 1 second
  maxDelayMs: 300000, // 5 minutes
  backoffMultiplier: 2,
  jitterFactor: 0.1, // 10% jitter
};

interface WebhookPayload {
  webhook_id?: string;
  user_id?: string;
  event_type: string;
  payload: Record<string, unknown>;
}

interface RetryableWebhook {
  webhook_id: string;
  url: string;
  secret: string;
  event_type: string;
  payload: Record<string, unknown>;
  attempt: number;
  delivery_id: string;
  next_retry_at?: string;
}

// Calculate delay with exponential backoff and jitter
function calculateBackoffDelay(attempt: number): number {
  const baseDelay = RETRY_CONFIG.baseDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(baseDelay, RETRY_CONFIG.maxDelayMs);
  
  // Add jitter to prevent thundering herd
  const jitter = cappedDelay * RETRY_CONFIG.jitterFactor * (Math.random() * 2 - 1);
  return Math.floor(cappedDelay + jitter);
}

// Generate HMAC-SHA256 signature
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

// Generate webhook delivery ID for idempotency
function generateDeliveryId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.getRandomValues(new Uint8Array(8));
  const randomHex = Array.from(randomPart).map(b => b.toString(16).padStart(2, '0')).join('');
  return `whd_${timestamp}${randomHex}`;
}

// Send notification when webhook fails after all retries
async function sendWebhookFailureNotification(
  supabaseClient: SupabaseClientType,
  webhook: { id: string; url: string; secret: string },
  eventType: string,
  deliveryId: string,
  attempts: number,
  statusCode?: number | null,
  errorMessage?: string
) {
  try {
    // Get the webhook owner and their email
    const { data: webhookData } = await supabaseClient
      .from('webhooks')
      .select('user_id, name')
      .eq('id', webhook.id)
      .single();

    if (!webhookData) {
      logStep("Could not find webhook owner for notification", { webhookId: webhook.id });
      return;
    }

    // Get user email from profiles
    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', webhookData.user_id)
      .single();

    const statusInfo = statusCode ? `Status: ${statusCode}` : `Erro: ${errorMessage || 'Desconhecido'}`;
    
    // Create in-app notification
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: webhookData.user_id,
        title: '⚠️ Webhook Falhou',
        message: `O webhook "${webhookData.name}" falhou após ${attempts} tentativas. Evento: ${eventType}. ${statusInfo}`,
        type: 'webhook_failure',
        action_url: '/dashboard',
        read: false
      });

    logStep("Webhook failure notification sent", { 
      userId: webhookData.user_id, 
      webhookName: webhookData.name,
      deliveryId,
      attempts
    });

    // Send email notification via Resend
    if (profileData?.email) {
      await sendWebhookFailureEmail(
        profileData.email,
        profileData.full_name || 'Usuário',
        webhookData.name,
        webhook.url,
        eventType,
        deliveryId,
        attempts,
        statusCode,
        errorMessage
      );
    }
  } catch (error) {
    logStep("Failed to send webhook failure notification", { 
      error: error instanceof Error ? error.message : 'Unknown error',
      webhookId: webhook.id
    });
  }
}

// Send email notification for webhook failure
async function sendWebhookFailureEmail(
  email: string,
  userName: string,
  webhookName: string,
  webhookUrl: string,
  eventType: string,
  deliveryId: string,
  attempts: number,
  statusCode?: number | null,
  errorMessage?: string
) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  if (!resendApiKey) {
    logStep("RESEND_API_KEY not configured, skipping email notification");
    return;
  }

  try {
    const resend = new Resend(resendApiKey);
    
    const statusInfo = statusCode 
      ? `Código HTTP: <strong>${statusCode}</strong>` 
      : `Erro: <strong>${errorMessage || 'Desconhecido'}</strong>`;

    const errorExplanation = getErrorExplanation(statusCode);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">⚠️ Webhook Falhou</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e9ecef; border-top: none;">
          <p style="margin-top: 0;">Olá <strong>${userName}</strong>,</p>
          
          <p>Seu webhook <strong>"${webhookName}"</strong> falhou após <strong>${attempts} tentativas</strong> de entrega.</p>
          
          <div style="background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #dc3545; font-size: 16px;">Detalhes da Falha</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Webhook:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: 500;">${webhookName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">URL:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-family: monospace; font-size: 12px; word-break: break-all;">${webhookUrl}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Evento:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-family: monospace;">${eventType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">ID de Entrega:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-family: monospace; font-size: 11px;">${deliveryId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Tentativas:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${attempts}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Status:</td>
                <td style="padding: 8px 0; color: #dc3545;">${statusInfo}</td>
              </tr>
            </table>
          </div>

          ${errorExplanation ? `
          <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>💡 Possível causa:</strong> ${errorExplanation}</p>
          </div>
          ` : ''}
          
          <div style="background: #e7f1ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #0066cc; font-size: 14px;">Próximos passos:</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
              <li>Verifique se a URL do webhook está correta e acessível</li>
              <li>Confirme que seu servidor está online e respondendo</li>
              <li>Revise os logs do webhook no painel de controle</li>
              <li>Teste o webhook manualmente usando o botão "Testar"</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 25px;">
            <a href="https://xpex.dev/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500;">Ver Detalhes no Dashboard</a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 25px 0;">
          
          <p style="margin-bottom: 0; font-size: 12px; color: #666; text-align: center;">
            Este é um email automático do sistema de webhooks XPEX.<br>
            Você pode gerenciar suas notificações no <a href="https://xpex.dev/dashboard" style="color: #667eea;">painel de controle</a>.
          </p>
        </div>
      </body>
      </html>
    `;

    const { error } = await resend.emails.send({
      from: "XPEX Webhooks <notifications@resend.dev>",
      to: [email],
      subject: `⚠️ Webhook "${webhookName}" falhou após ${attempts} tentativas`,
      html: emailHtml,
    });

    if (error) {
      logStep("Failed to send email via Resend", { error: error.message });
    } else {
      logStep("Webhook failure email sent successfully", { email, webhookName });
    }
  } catch (error) {
    logStep("Error sending webhook failure email", { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// Get human-readable explanation for HTTP status codes
function getErrorExplanation(statusCode?: number | null): string | null {
  if (!statusCode) return null;
  
  const explanations: Record<number, string> = {
    400: "O servidor retornou um erro de requisição inválida. Verifique o formato do payload.",
    401: "Autenticação falhou. Verifique se o servidor está configurado para aceitar a assinatura do webhook.",
    403: "Acesso negado. O servidor recusou a conexão.",
    404: "URL não encontrada. Verifique se o endpoint do webhook está correto.",
    408: "Timeout de requisição. O servidor demorou muito para responder.",
    429: "Muitas requisições. O servidor está aplicando rate limiting.",
    500: "Erro interno do servidor. Verifique os logs do seu servidor de destino.",
    502: "Bad Gateway. Pode haver um problema com proxy ou load balancer.",
    503: "Serviço indisponível. O servidor pode estar em manutenção ou sobrecarregado.",
    504: "Gateway timeout. O servidor intermediário não recebeu resposta a tempo.",
  };
  
  return explanations[statusCode] || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientType = any;

// Send webhook with retry logic
async function sendWebhookWithRetry(
  supabaseClient: SupabaseClientType,
  webhook: { id: string; url: string; secret: string },
  eventType: string,
  payload: Record<string, unknown>,
  deliveryId: string,
  attempt: number = 1
): Promise<{
  webhook_id: string;
  delivery_id: string;
  success: boolean;
  status?: number;
  error?: string;
  attempts: number;
  will_retry: boolean;
  next_retry_at?: string;
}> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  const webhookPayload = {
    id: deliveryId,
    event: eventType,
    timestamp: new Date().toISOString(),
    api_version: '2024-01-01',
    attempt,
    max_attempts: RETRY_CONFIG.maxAttempts,
    data: payload
  };

  const bodyString = JSON.stringify(webhookPayload);
  const signature = await generateSignature(webhook.secret, timestamp, bodyString);
  const signatureHeader = `t=${timestamp},v1=${signature}`;

  try {
    logStep("Sending webhook", { 
      url: webhook.url, 
      event: eventType,
      deliveryId,
      attempt,
      maxAttempts: RETRY_CONFIG.maxAttempts
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'XPEX-Webhook/1.0',
        'X-Webhook-Id': deliveryId,
        'X-Webhook-Signature': signatureHeader,
        'X-Webhook-Timestamp': timestamp,
        'X-Webhook-Event': eventType,
        'X-Webhook-Attempt': attempt.toString(),
        'X-Webhook-Max-Attempts': RETRY_CONFIG.maxAttempts.toString(),
      },
      body: bodyString,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    const responseText = await response.text().catch(() => '');
    const success = response.ok;

    // Determine if we should retry
    const shouldRetry = !success && attempt < RETRY_CONFIG.maxAttempts && isRetryableStatus(response.status);
    const nextRetryAt = shouldRetry 
      ? new Date(Date.now() + calculateBackoffDelay(attempt)).toISOString() 
      : undefined;

    // Log the delivery
    await supabaseClient
      .from('webhook_logs')
      .insert({
        webhook_id: webhook.id,
        event_type: eventType,
        payload: {
          ...webhookPayload,
          _delivery: {
            id: deliveryId,
            signature_header: signatureHeader,
            timestamp,
            attempt,
            will_retry: shouldRetry,
            next_retry_at: nextRetryAt
          }
        },
        status_code: response.status,
        response: responseText.substring(0, 1000),
        success,
        attempts: attempt
      });

    logStep("Webhook response", { 
      url: webhook.url, 
      status: response.status, 
      success,
      deliveryId,
      attempt,
      willRetry: shouldRetry
    });

    // Schedule retry if needed
    if (shouldRetry) {
      const delayMs = calculateBackoffDelay(attempt);
      logStep("Scheduling retry", { 
        deliveryId, 
        attempt: attempt + 1, 
        delayMs,
        nextRetryAt
      });
      
      // Use EdgeRuntime.waitUntil for background retry
      scheduleRetry(supabaseClient, webhook, eventType, payload, deliveryId, attempt + 1, delayMs);
    } else if (!success && attempt >= RETRY_CONFIG.maxAttempts) {
      // All retries exhausted - send failure notification
      await sendWebhookFailureNotification(supabaseClient, webhook, eventType, deliveryId, attempt, response.status);
    }

    return {
      webhook_id: webhook.id, 
      delivery_id: deliveryId,
      success, 
      status: response.status,
      attempts: attempt,
      will_retry: shouldRetry,
      next_retry_at: nextRetryAt
    };
  } catch (fetchError) {
    const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
    const isTimeout = errorMessage.includes('aborted');
    
    // Determine if we should retry
    const shouldRetry = attempt < RETRY_CONFIG.maxAttempts;
    const nextRetryAt = shouldRetry 
      ? new Date(Date.now() + calculateBackoffDelay(attempt)).toISOString() 
      : undefined;

    // Log failed delivery
    await supabaseClient
      .from('webhook_logs')
      .insert({
        webhook_id: webhook.id,
        event_type: eventType,
        payload: {
          ...webhookPayload,
          _delivery: {
            id: deliveryId,
            error: errorMessage,
            is_timeout: isTimeout,
            attempt,
            will_retry: shouldRetry,
            next_retry_at: nextRetryAt
          }
        },
        status_code: null,
        response: errorMessage,
        success: false,
        attempts: attempt
      });

    logStep("Webhook failed", { 
      url: webhook.url, 
      error: errorMessage,
      deliveryId,
      attempt,
      isTimeout,
      willRetry: shouldRetry
    });

    // Schedule retry if needed
    if (shouldRetry) {
      const delayMs = calculateBackoffDelay(attempt);
      logStep("Scheduling retry after failure", { 
        deliveryId, 
        attempt: attempt + 1, 
        delayMs
      });
      
      scheduleRetry(supabaseClient, webhook, eventType, payload, deliveryId, attempt + 1, delayMs);
    } else if (attempt >= RETRY_CONFIG.maxAttempts) {
      // All retries exhausted - send failure notification
      await sendWebhookFailureNotification(supabaseClient, webhook, eventType, deliveryId, attempt, null, errorMessage);
    }

    return { 
      webhook_id: webhook.id, 
      delivery_id: deliveryId,
      success: false, 
      error: errorMessage,
      attempts: attempt,
      will_retry: shouldRetry,
      next_retry_at: nextRetryAt
    };
  }
}

// Check if HTTP status code is retryable
function isRetryableStatus(status: number): boolean {
  // Retry on 5xx server errors and specific client errors
  const retryableStatuses = [
    408, // Request Timeout
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
  ];
  return retryableStatuses.includes(status);
}

// Schedule a retry using background task
function scheduleRetry(
  supabaseClient: SupabaseClientType,
  webhook: { id: string; url: string; secret: string },
  eventType: string,
  payload: Record<string, unknown>,
  deliveryId: string,
  nextAttempt: number,
  delayMs: number
) {
  // Use EdgeRuntime.waitUntil to run retry in background
  const retryTask = async () => {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    logStep("Executing scheduled retry", { deliveryId, attempt: nextAttempt });
    await sendWebhookWithRetry(supabaseClient, webhook, eventType, payload, deliveryId, nextAttempt);
  };

  // @ts-ignore - EdgeRuntime is available in Deno Deploy
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
    // @ts-ignore
    EdgeRuntime.waitUntil(retryTask());
  } else {
    // Fallback for local development - just run async
    retryTask().catch(err => {
      logStep("Retry task failed", { deliveryId, error: err.message });
    });
  }
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
        return sendWebhookWithRetry(supabaseClient, webhook, event_type, payload, deliveryId);
      })
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        retry_info: {
          max_attempts: RETRY_CONFIG.maxAttempts,
          backoff_strategy: 'exponential',
          base_delay_ms: RETRY_CONFIG.baseDelayMs,
          max_delay_ms: RETRY_CONFIG.maxDelayMs,
          jitter: true,
          retryable_status_codes: [408, 429, 500, 502, 503, 504]
        },
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