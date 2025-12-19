// Analytics tracking utility for conversion events
// Integrated with Google Analytics 4

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
  | 'login_completed'
  | 'page_view';

interface EventProperties {
  [key: string]: string | number | boolean | undefined | Record<string, any>[] | Record<string, any>;
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
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
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event.name, event.properties);
    }

    // Send to Google Analytics 4
    this.sendToGA4(eventName, properties);

    // Store in localStorage for debugging
    this.storeLocally(event);
  }

  private sendToGA4(eventName: string, properties?: EventProperties) {
    if (typeof window !== 'undefined' && window.gtag) {
      // Map custom events to GA4 recommended events where applicable
      const ga4EventMap: Record<string, string> = {
        'checkout_initiated': 'begin_checkout',
        'plan_selected': 'select_item',
        'credits_purchased': 'purchase',
        'signup_started': 'sign_up',
        'login_completed': 'login',
      };

      const ga4EventName = ga4EventMap[eventName] || eventName;
      
      window.gtag('event', ga4EventName, {
        event_category: 'conversion',
        event_label: eventName,
        ...properties,
      });
    }
  }

  private storeLocally(event: { name: string; properties: EventProperties }) {
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

  // Page view tracking
  trackPageView(pagePath: string, pageTitle?: string) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle,
      });
    }
    this.track('page_view', { page_path: pagePath, page_title: pageTitle });
  }

  // Convenience methods for common events
  trackCTAClick(ctaName: string, location?: string) {
    this.track('cta_click', { cta_name: ctaName, location });
  }

  trackCheckoutInitiated(tier: string, price?: number, priceId?: string) {
    this.track('checkout_initiated', { 
      tier, 
      price,
      currency: 'USD',
      items: [{ item_name: tier, price }],
      stripe_price_id: priceId
    });
  }

  trackAPIKeyGenerated(keyName: string) {
    this.track('api_key_generated', { key_name: keyName });
  }

  trackAPIKeyDeleted(keyName: string) {
    this.track('api_key_deleted', { key_name: keyName });
  }

  trackEmailValidated(isValid: boolean, riskScore?: number) {
    this.track('email_validated', { is_valid: isValid, risk_score: riskScore });
  }

  trackPlanSelected(tier: string, price?: number) {
    this.track('plan_selected', { 
      tier,
      value: price,
      currency: 'USD'
    });
  }

  trackCreditsPackage(packageName: string, credits: number, price?: number) {
    this.track('credits_purchased', { 
      package_name: packageName, 
      credits,
      value: price,
      currency: 'USD'
    });
  }

  trackDemoStarted(apiName: string) {
    this.track('demo_started', { api_name: apiName });
  }

  trackSignupStarted(method?: string) {
    this.track('signup_started', { method });
  }

  trackLoginCompleted(method?: string) {
    this.track('login_completed', { method });
  }
}

export const analytics = new Analytics();
