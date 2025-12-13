import { Button } from "@/components/ui/button";
import { Check, Zap, Building2, Rocket } from "lucide-react";
import { useSubscription, STRIPE_PRICES } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Free",
    description: "Perfect for testing and small projects",
    price: "$0",
    period: "/month",
    icon: Zap,
    features: [
      "100 API calls/month",
      "All APIs access",
      "Community support",
      "Basic analytics",
      "Standard latency",
    ],
    cta: "Get Started",
    tier: "free" as const,
    popular: false,
  },
  {
    name: "Pro",
    description: "For growing businesses and power users",
    price: "$29",
    period: "/month",
    icon: Rocket,
    features: [
      "20,000 API calls/month",
      "All APIs access",
      "Priority support",
      "Advanced analytics",
      "Low latency (<50ms)",
      "Webhook notifications",
      "Custom rate limits",
    ],
    cta: "Start Pro Trial",
    tier: "pro" as const,
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    price: "$199",
    period: "/month",
    icon: Building2,
    features: [
      "Unlimited API calls",
      "Dedicated infrastructure",
      "24/7 premium support",
      "Custom SLA (99.99%)",
      "Ultra-low latency",
      "White-label options",
      "On-premise deployment",
      "Custom integrations",
    ],
    cta: "Start Enterprise",
    tier: "enterprise" as const,
    popular: false,
  },
];

const PricingSection = () => {
  const { subscription, startCheckout } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePlanClick = async (tier: 'free' | 'pro' | 'enterprise') => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (tier === 'free') {
      navigate('/dashboard');
      return;
    }

    await startCheckout(tier);
  };

  return (
    <section id="pricing" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Simple,</span>{" "}
            <span className="text-gradient">Transparent</span>{" "}
            <span className="text-foreground">Pricing</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start free, scale as you grow. Pay only for what you use.
            All plans include access to our complete API portfolio.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const isCurrentPlan = subscription.tier === plan.tier;
            
            return (
              <div
                key={plan.name}
                className={`relative card-cyber rounded-3xl p-8 transition-all duration-500 hover:scale-105 animate-fade-in ${
                  plan.popular
                    ? "border-primary/50 shadow-lg shadow-primary/20"
                    : isCurrentPlan
                    ? "border-green-500/50 shadow-lg shadow-green-500/20"
                    : "border-border/50"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold rounded-full">
                    Most Popular
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-green-500 to-green-400 text-white text-sm font-semibold rounded-full">
                    Your Plan
                  </div>
                )}

                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl mb-6 ${
                  plan.popular ? "bg-primary/20" : isCurrentPlan ? "bg-green-500/20" : "bg-secondary/50"
                }`}>
                  <plan.icon className={`w-6 h-6 ${
                    plan.popular ? "text-primary" : isCurrentPlan ? "text-green-400" : "text-muted-foreground"
                  }`} />
                </div>

                {/* Plan Info */}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <span className={`text-5xl font-bold ${plan.popular ? "text-gradient" : ""}`}>
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 mt-0.5 ${
                        plan.popular ? "text-primary" : isCurrentPlan ? "text-green-400" : "text-muted-foreground"
                      }`} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button 
                  variant={plan.popular ? "cyber" : isCurrentPlan ? "outline" : "glass"}
                  size="lg" 
                  className="w-full"
                  onClick={() => handlePlanClick(plan.tier)}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? 'Current Plan' : plan.cta}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <p className="text-center text-sm text-muted-foreground mt-12">
          All prices in USD. Need more? Volume discounts available for 100k+ calls/month.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
