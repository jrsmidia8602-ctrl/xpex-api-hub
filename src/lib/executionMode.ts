/**
 * Execution Mode Utility
 * Controls whether API calls use demo (mock) or live (real) responses
 */

export type ExecutionMode = 'demo' | 'live';

const EXECUTION_MODE_KEY = 'xpex_execution_mode';

/**
 * Get current execution mode
 * Defaults to 'demo' for safety
 */
export function getExecutionMode(): ExecutionMode {
  if (typeof window === 'undefined') return 'demo';
  const stored = localStorage.getItem(EXECUTION_MODE_KEY);
  return (stored === 'live') ? 'live' : 'demo';
}

/**
 * Set execution mode
 */
export function setExecutionMode(mode: ExecutionMode): void {
  localStorage.setItem(EXECUTION_MODE_KEY, mode);
}

/**
 * Check if currently in demo mode
 */
export function isDemoMode(): boolean {
  return getExecutionMode() === 'demo';
}

/**
 * Check if currently in live mode
 */
export function isLiveMode(): boolean {
  return getExecutionMode() === 'live';
}

/**
 * Toggle between demo and live mode
 */
export function toggleExecutionMode(): ExecutionMode {
  const current = getExecutionMode();
  const next: ExecutionMode = current === 'demo' ? 'live' : 'demo';
  setExecutionMode(next);
  return next;
}

/**
 * Mock data generators for demo mode
 */
export const mockResponses = {
  breachScan: (email: string) => ({
    email,
    breaches_found: 3,
    risk_level: 'high',
    breaches: [
      {
        name: 'LinkedIn 2021',
        date: '2021-06-22',
        data_exposed: ['email', 'phone', 'name'],
        severity: 'high',
      },
      {
        name: 'Adobe 2019',
        date: '2019-10-15',
        data_exposed: ['email', 'password_hash'],
        severity: 'critical',
      },
      {
        name: 'Canva 2019',
        date: '2019-05-24',
        data_exposed: ['email', 'name', 'username'],
        severity: 'medium',
      },
    ],
    recommendations: [
      'Altere suas senhas imediatamente',
      'Ative autenticação de dois fatores',
      'Monitore suas contas para atividades suspeitas',
    ],
    scanned_at: new Date().toISOString(),
  }),

  copyVoraz: (prompt: string) => ({
    success: true,
    copies: [
      {
        type: 'headline',
        text: `🚀 ${prompt.slice(0, 30)}... - A Revolução que Você Esperava`,
        tone: 'exciting',
      },
      {
        type: 'cta',
        text: 'Comece Agora e Transforme Seus Resultados →',
        tone: 'urgent',
      },
      {
        type: 'description',
        text: `Descubra como milhares de profissionais já estão usando ${prompt.slice(0, 20)}... para multiplicar seus resultados. Sem complicação, sem curva de aprendizado.`,
        tone: 'professional',
      },
    ],
    generated_at: new Date().toISOString(),
  }),

  extrairProdutos: (url: string) => ({
    success: true,
    url,
    products: [
      {
        name: 'Produto Premium',
        price: 'R$ 299,90',
        currency: 'BRL',
        image_url: 'https://via.placeholder.com/300',
        available: true,
      },
      {
        name: 'Produto Standard',
        price: 'R$ 149,90',
        currency: 'BRL',
        image_url: 'https://via.placeholder.com/300',
        available: true,
      },
    ],
    total_found: 2,
    extracted_at: new Date().toISOString(),
  }),

  linkMagic: (url: string) => ({
    success: true,
    original_url: url,
    short_url: `https://xpex.link/${Math.random().toString(36).substring(7)}`,
    qr_code: 'https://via.placeholder.com/200',
    analytics_enabled: true,
    created_at: new Date().toISOString(),
  }),
};

/**
 * Helper to get response based on execution mode
 */
export async function getApiResponse<T>(
  apiCall: () => Promise<T>,
  mockData: T,
  delayMs: number = 800
): Promise<T> {
  if (isDemoMode()) {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return mockData;
  }
  return apiCall();
}
