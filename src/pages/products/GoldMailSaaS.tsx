import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  CreditCard, 
  Brain, 
  FileText, 
  Users, 
  Bell,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  Building2,
  Megaphone,
  Bot,
  Settings
} from "lucide-react";

const GoldMailSaaS = () => {
  const navigate = useNavigate();

  const features = [
    { icon: BarChart3, title: "Live Analytics", description: "Real-time validation volume, success rates, risk distribution and latency metrics." },
    { icon: CreditCard, title: "Credits & Billing", description: "Stripe-powered usage tracking, credit balance, invoices and plan upgrades." },
    { icon: Brain, title: "Risk Intelligence", description: "Email risk scoring, disposable detection, domain trust and SMTP insights." },
    { icon: FileText, title: "Validation Logs", description: "Searchable logs with full validation breakdown and metadata." },
    { icon: Users, title: "Team Management", description: "Multi-user access, roles, permissions and API key isolation." },
    { icon: Bell, title: "Alerts & Webhooks", description: "Notify systems or teams when thresholds or anomalies occur." }
  ];

  const dashboardWidgets = [
    { name: "Validations Today", value: "12,482" },
    { name: "Avg Latency", value: "214ms" },
    { name: "Risky Emails", value: "3.1%" },
    { name: "Credits Remaining", value: "18,520" }
  ];

  const useCases = [
    { icon: Building2, name: "SaaS Platforms", description: "Protect signups, reduce fraud and improve email deliverability." },
    { icon: Megaphone, name: "Marketing Teams", description: "Clean lists, improve campaigns and protect sender reputation." },
    { icon: Bot, name: "AI & Automation", description: "Use GoldMail as a decision layer for agents and workflows." },
    { icon: Settings, name: "Enterprise Ops", description: "Centralized validation governance with SLAs and observability." }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-amber-500/10 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => navigate('/products/gold-email-validator')}
            >
              <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <span className="text-black text-sm">✉️</span>
              </div>
              <span className="font-bold text-lg">GoldMail Validation</span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <span onClick={() => navigate('/products/gold-email-validator')} className="hover:text-amber-400 cursor-pointer transition-colors">Overview</span>
              <span className="text-amber-400 cursor-pointer">Products</span>
              <span onClick={() => navigate('/docs')} className="hover:text-amber-400 cursor-pointer transition-colors">Developers</span>
              <span onClick={() => navigate('/pricing')} className="hover:text-amber-400 cursor-pointer transition-colors">Pricing</span>
              <span onClick={() => navigate('/docs')} className="hover:text-amber-400 cursor-pointer transition-colors">Docs</span>
            </nav>

            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              onClick={() => navigate('/dashboard')}
            >
              Open Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
        
        <div className="container mx-auto max-w-4xl text-center relative">
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {["Enterprise SaaS", "Multi-tenant", "Usage-Based Billing", "Real-time Analytics"].map((badge) => (
              <Badge key={badge} variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/5">
                {badge}
              </Badge>
            ))}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            GoldMail{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
              SaaS Console
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The command center for email intelligence, validation, risk and performance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2"
              onClick={() => navigate('/dashboard')}
            >
              <Zap className="w-4 h-4" />
              Launch SaaS Demo
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-amber-500/30 hover:bg-amber-500/10"
              onClick={() => navigate('/docs')}
            >
              View API Docs
            </Button>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 px-4 border-t border-amber-500/10">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">What is GoldMail SaaS?</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            GoldMail SaaS is the operational layer of the GoldMail ecosystem. It allows teams to manage validations, credits, users, logs, risk scores and integrations in real time — without touching code.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 border-t border-amber-500/10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Core SaaS Capabilities</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6 bg-card/50 border-amber-500/10 hover:border-amber-500/30 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-16 px-4 border-t border-amber-500/10 bg-gradient-to-b from-amber-500/5 to-transparent">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">SaaS Dashboard Preview</h2>
          </div>

          <Card className="p-8 bg-card/80 border-amber-500/20 backdrop-blur-sm">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardWidgets.map((widget) => (
                <div key={widget.name} className="text-center p-4 rounded-lg bg-background/50 border border-amber-500/10">
                  <div className="text-2xl md:text-3xl font-bold text-amber-400 mb-1">{widget.value}</div>
                  <div className="text-sm text-muted-foreground">{widget.name}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 rounded-lg bg-background/30 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">Live System Status</span>
              </div>
              <div className="h-32 flex items-center justify-center text-muted-foreground border border-dashed border-amber-500/20 rounded-lg">
                <span className="text-sm">Real-time validation activity graph</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4 border-t border-amber-500/10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Who is GoldMail SaaS for?</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase) => (
              <Card key={useCase.name} className="p-6 bg-card/50 border-amber-500/10 hover:border-amber-500/30 transition-colors text-center">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4 mx-auto">
                  <useCase.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">{useCase.name}</h3>
                <p className="text-muted-foreground text-sm">{useCase.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Bridge */}
      <section className="py-16 px-4 border-t border-amber-500/10">
        <div className="container mx-auto max-w-3xl text-center">
          <Shield className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Powered by GoldMail Plans</h2>
          <p className="text-muted-foreground mb-6">
            GoldMail SaaS uses the same credit system as the API. One balance, multiple products.
          </p>
          <Button 
            variant="outline" 
            className="border-amber-500/30 hover:bg-amber-500/10 gap-2"
            onClick={() => navigate('/pricing')}
          >
            View Pricing <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 border-t border-amber-500/10 bg-gradient-to-t from-amber-500/5 to-transparent">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Launch Your Email Intelligence Console
          </h2>
          <p className="text-muted-foreground mb-8">
            Start with GoldMail SaaS and scale across APIs, plugins and agents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              onClick={() => navigate('/auth')}
            >
              Start Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-amber-500/30 hover:bg-amber-500/10"
              onClick={() => navigate('/contact')}
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-amber-500/10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              <span className="text-muted-foreground text-sm">GoldMail SaaS · Part of XPEX Neural</span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {["Stripe Billing", "Mixpanel Analytics", "Role-Based Access", "Global Edge Infra"].map((item) => (
                <span key={item} className="px-2 py-1 rounded bg-amber-500/5 border border-amber-500/10">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GoldMailSaaS;
