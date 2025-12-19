import { Button } from "@/components/ui/button";
import { Check, Zap, Building2, Rocket } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import CreditPackages from "./CreditPackages";
import { analytics } from "@/lib/analytics";

const plans = [
  {
    name: "Grátis",
    description: "Perfeito para testes e pequenos projetos",
    price: "$0",
    period: "/mês",
    icon: Zap,
    features: [
      "20.000 chamadas API",
      "Acesso ao portfólio completo",
      "Suporte da comunidade",
      "Analytics básico",
      "Latência padrão",
    ],
    cta: "Começar Grátis",
    tier: "free" as const,
    popular: false,
  },
  {
    name: "PRO",
    description: "Para negócios em crescimento e power users",
    price: "$29",
    period: "/mês",
    icon: Rocket,
    features: [
      "20.000 chamadas API/mês",
      "Acesso completo às APIs",
      "Suporte prioritário",
      "Analytics avançado",
      "Baixa latência (<50ms)",
      "Notificações via Webhook",
      "Rate limits customizados",
    ],
    cta: "Iniciar PRO",
    tier: "pro" as const,
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Soluções customizadas para grandes organizações",
    price: "$199",
    period: "/mês",
    icon: Building2,
    features: [
      "Chamadas API ilimitadas",
      "Infraestrutura dedicada",
      "Suporte premium 24/7",
      "SLA customizado (99.99%)",
      "Latência ultra-baixa",
      "Opções white-label",
      "Deploy on-premise",
      "Integrações customizadas",
    ],
    cta: "Iniciar Enterprise",
    tier: "enterprise" as const,
    popular: false,
  },
];

const PricingSection = () => {
  const { subscription, startCheckout } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePlanClick = async (tier: 'free' | 'pro' | 'enterprise') => {
    analytics.trackPlanSelected(tier);
    
    if (!user) {
      analytics.trackCTAClick('plan_auth_redirect', 'pricing');
      navigate('/auth');
      return;
    }

    if (tier === 'free') {
      analytics.trackCTAClick('free_plan_dashboard', 'pricing');
      navigate('/dashboard');
      return;
    }

    analytics.trackCheckoutInitiated(tier, tier === 'pro' ? 29 : 199);
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
            <span className="text-foreground">Preços</span>{" "}
            <span className="text-gradient">Simples</span>{" "}
            <span className="text-foreground">e Transparentes</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comece grátis, escale conforme cresce. Pague apenas pelo que usar.
            Todos os planos incluem acesso ao portfólio completo de APIs.
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
                    Mais Popular
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-green-500 to-green-400 text-white text-sm font-semibold rounded-full">
                    Seu Plano
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
                  {isCurrentPlan ? 'Plano Atual' : plan.cta}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <p className="text-center text-sm text-muted-foreground mt-12">
          Todos os preços em USD. Precisa de mais? Descontos por volume disponíveis para 100k+ chamadas/mês.
        </p>

        {/* Credit Packages */}
        <CreditPackages />
      </div>
    </section>
  );
};

export default PricingSection;
