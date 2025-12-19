// Analytics tracking utility for conversion events
// Extensible to integrate with Google Analytics, Mixpanel, etc.

type EventName = 
  | 'cta_click'
  | 'checkout_initiated'
  | 'api_key_generated'
  | 'api_key_deleted'
  | 'email_validated'
  | 'plan_selected'
  | 'credits_purchased'
  | 'demo_started'
  | 'signup_started'
  | 'login_completed';

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

class Analytics {
  private isEnabled: boolean = true;

  track(eventName: EventName, properties?: EventProperties) {
    if (!this.isEnabled) return;

    const event = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      },
    };

    // Log to console in development
    console.log('[Analytics]', event.name, event.properties);

    // Send to any analytics service
    this.sendToService(event);
  }

  private sendToService(event: { name: string; properties: EventProperties }) {
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.name, event.properties);
    }

    // Store in localStorage for debugging
    if (typeof window !== 'undefined') {
      try {
        const events = JSON.parse(localStorage.getItem('xpex_analytics') || '[]');
        events.push(event);
        // Keep only last 100 events
        if (events.length > 100) events.shift();
        localStorage.setItem('xpex_analytics', JSON.stringify(events));
      } catch (e) {
        // Ignore storage errors
      }
    }
  }

  // Convenience methods for common events
  trackCTAClick(ctaName: string, location?: string) {
    this.track('cta_click', { cta_name: ctaName, location });
  }

  trackCheckoutInitiated(tier: string, price?: number) {
    this.track('checkout_initiated', { tier, price });
  }

  trackAPIKeyGenerated(keyName: string) {
    this.track('api_key_generated', { key_name: keyName });
  }

  trackEmailValidated(isValid: boolean, riskScore?: number) {
    this.track('email_validated', { is_valid: isValid, risk_score: riskScore });
  }

  trackPlanSelected(tier: string) {
    this.track('plan_selected', { tier });
  }

  trackCreditsPackage(packageName: string, credits: number) {
    this.track('credits_purchased', { package_name: packageName, credits });
  }

  trackDemoStarted(apiName: string) {
    this.track('demo_started', { api_name: apiName });
  }
}

export const analytics = new Analytics();
