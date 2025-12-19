// Analytics tracking utility for conversion events
// Integrated with Google Analytics 4 and Mixpanel

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
  | 'page_view'
  | 'live_demo_interaction';

interface EventProperties {
  [key: string]: string | number | boolean | undefined | Record<string, any>[] | Record<string, any>;
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    mixpanel?: {
      init: (token: string, config?: object) => void;
      track: (event: string, properties?: object) => void;
      track_pageview: (properties?: object) => void;
      identify: (id: string) => void;
      reset: () => void;
      people: {
        set: (properties: object) => void;
        set_once: (properties: object) => void;
        increment: (property: string, value?: number) => void;
      };
      register: (properties: object) => void;
      time_event: (eventName: string) => void;
    };
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

    // Send to Mixpanel
    this.sendToMixpanel(eventName, properties);

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

  private sendToMixpanel(eventName: string, properties?: EventProperties) {
    if (typeof window !== 'undefined' && window.mixpanel) {
      // Map to Mixpanel-friendly event names
      const mixpanelEventMap: Record<string, string> = {
        'checkout_initiated': 'Checkout Started',
        'plan_selected': 'Plan Selected',
        'credits_purchased': 'Credits Purchased',
        'signup_started': 'Signup Started',
        'login_completed': 'Login Completed',
        'cta_click': 'CTA Clicked',
        'api_key_generated': 'API Key Generated',
        'api_key_deleted': 'API Key Deleted',
        'email_validated': 'Email Validated',
        'demo_started': 'Demo Started',
        'page_view': 'Page Viewed',
        'live_demo_interaction': 'Live Demo Interaction',
      };

      const mixpanelEventName = mixpanelEventMap[eventName] || eventName;
      
      window.mixpanel.track(mixpanelEventName, {
        ...properties,
        timestamp: new Date().toISOString(),
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
    // Start timing the signup funnel
    if (typeof window !== 'undefined' && window.mixpanel) {
      window.mixpanel.time_event('Signup Completed');
    }
    this.track('signup_started', { method });
  }

  trackLoginCompleted(method?: string) {
    this.track('login_completed', { method });
  }

  // User identification for Mixpanel
  identifyUser(userId: string, email?: string, properties?: Record<string, any>) {
    if (typeof window !== 'undefined' && window.mixpanel) {
      // Identify the user
      window.mixpanel.identify(userId);
      
      // Set user profile properties
      window.mixpanel.people.set({
        $email: email,
        $last_login: new Date().toISOString(),
        ...properties,
      });

      // Set properties that should only be set once
      window.mixpanel.people.set_once({
        $created: new Date().toISOString(),
        first_seen: new Date().toISOString(),
      });

      // Register super properties for all future events
      window.mixpanel.register({
        user_id: userId,
        user_email: email,
      });

      console.log('[Analytics] User identified:', userId);
    }

    // Also set user ID in GA4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('set', 'user_id', userId);
      window.gtag('set', 'user_properties', {
        email: email,
        ...properties,
      });
    }
  }

  // Reset user identity on logout
  resetUser() {
    if (typeof window !== 'undefined' && window.mixpanel) {
      window.mixpanel.reset();
      console.log('[Analytics] User identity reset');
    }
  }

  // Funnel tracking methods
  startCheckoutFunnel(tier: string, priceId?: string) {
    if (typeof window !== 'undefined' && window.mixpanel) {
      window.mixpanel.time_event('Checkout Completed');
    }
    this.trackCheckoutInitiated(tier, undefined, priceId);
  }

  completeCheckout(tier: string, price: number, transactionId?: string) {
    if (typeof window !== 'undefined' && window.mixpanel) {
      window.mixpanel.track('Checkout Completed', {
        tier,
        price,
        currency: 'USD',
        transaction_id: transactionId,
      });
      
      // Increment purchase count
      window.mixpanel.people.increment('total_purchases');
      window.mixpanel.people.set({
        last_purchase_date: new Date().toISOString(),
        last_purchase_tier: tier,
      });
    }
  }

  completePurchase(packageName: string, credits: number, price: number, transactionId?: string) {
    if (typeof window !== 'undefined' && window.mixpanel) {
      window.mixpanel.track('Purchase Completed', {
        package_name: packageName,
        credits,
        price,
        currency: 'USD',
        transaction_id: transactionId,
      });
      
      // Update user profile
      window.mixpanel.people.increment('total_credits_purchased', credits);
      window.mixpanel.people.increment('total_spent', price);
      window.mixpanel.people.set({
        last_purchase_date: new Date().toISOString(),
      });
    }
  }

  completeSignup(userId: string, email: string, method?: string) {
    if (typeof window !== 'undefined' && window.mixpanel) {
      window.mixpanel.track('Signup Completed', {
        method,
        user_id: userId,
      });
    }
    // Identify the new user
    this.identifyUser(userId, email, { signup_method: method });
  }
}

export const analytics = new Analytics();
