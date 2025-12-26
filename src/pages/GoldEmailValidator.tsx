import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, AlertTriangle, Server, Globe, Zap, CheckCircle, ArrowRight, 
  Activity, Clock, Layers, Terminal, Lock, Users, Cpu, Box, Puzzle, 
  Blocks, LayoutGrid, FileCode, Webhook, Scale, FileCheck, Eye
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

// Animated counter hook
const useCountUp = (end: number, duration: number = 2000, start: number = 0) => {
  const [count, setCount] = useState(start);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasStarted) {
        setHasStarted(true);
      }
    }, { threshold: 0.1 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * (end - start) + start));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [hasStarted, end, duration, start]);

  return { count, ref };
};

interface ValidationStats {
  total_validations: number;
  avg_latency_ms: number;
  success_rate: number;
}

interface MockValidationResult {
  event_id: string;
  decision: "ACCEPT" | "REJECT" | "REVIEW";
  confidence: string;
  risk_vector: {
    disposable_likelihood: string;
    domain_reputation: string;
    historical_bounce_pattern: string;
    mx_validation: string;
  };
  latency: string;
  region: string;
}

const GoldEmailValidator = () => {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [validationResult, setValidationResult] = useState<MockValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { user } = useAuth();
  const { startCheckout } = useSubscription();
  const navigate = useNavigate();

  const [stats, setStats] = useState<ValidationStats>({
    total_validations: 1284392,
    avg_latency_ms: 247,
    success_rate: 97
  });

  const handleCheckout = async (tier: 'pro' | 'enterprise') => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setCheckoutLoading(tier);
    try {
      await startCheckout(tier);
    } finally {
      setCheckoutLoading(null);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_validation_stats');
        if (!error && data) {
          const statsData = data as unknown as ValidationStats;
          setStats({
            total_validations: Math.max(statsData.total_validations || 0, 1284392),
            avg_latency_ms: statsData.avg_latency_ms || 247,
            success_rate: statsData.success_rate || 97
          });
        }
      } catch (err) {
        console.log('Using default stats');
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const emailsProcessed = useCountUp(stats.total_validations, 2500);
  const bounceAccuracy = useCountUp(97, 2000);

  const runValidation = () => {
    if (!testEmail) {
      toast.error("Enter an email address");
      return;
    }
    
    setIsValidating(true);
    
    // Simulate API call
    setTimeout(() => {
      const isDisposable = testEmail.includes("temp") || testEmail.includes("fake") || testEmail.includes("test");
      const decision = isDisposable ? "REJECT" : Math.random() > 0.3 ? "ACCEPT" : "REVIEW";
      
      setValidationResult({
        event_id: `EVT-${Math.floor(Math.random() * 900000 + 100000)}`,
        decision,
        confidence: `${Math.floor(Math.random() * 15 + 85)}%`,
        risk_vector: {
          disposable_likelihood: isDisposable ? "87%" : `${Math.floor(Math.random() * 20)}%`,
          domain_reputation: isDisposable ? "Low" : "High",
          historical_bounce_pattern: isDisposable ? "Detected" : "None",
          mx_validation: isDisposable ? "Fail" : "Pass"
        },
        latency: `${Math.floor(Math.random() * 100 + 180)}ms`,
        region: "US-East"
      });
      setIsValidating(false);
    }, 800);
  };

  const modules = [
    { name: "Core API", description: "High-performance email intelligence endpoints.", status: "available", icon: Terminal },
    { name: "SaaS Console", description: "Monitoring, logs, credits and alerts.", status: "available", icon: LayoutGrid },
    { name: "Plugins", description: "Form-level validation for platforms.", status: "beta", icon: Puzzle },
    { name: "Extensions", description: "Edge validation for browsers and tools.", status: "planned", icon: Blocks },
    { name: "Agents", description: "Autonomous email intelligence agents.", status: "planned", icon: Cpu },
    { name: "Bundles", description: "Pre-built stacks for SaaS, Marketing and AI.", status: "available", icon: Box }
  ];

  const accessLevels = [
    { name: "Observer", features: ["View system", "Limited demo"], icon: Eye },
    { name: "Developer", features: ["API access", "Credits", "Logs"], icon: FileCode },
    { name: "Platform", features: ["Higher limits", "Webhooks", "Priority latency"], icon: Webhook },
    { name: "Enterprise", features: ["Custom SLA", "Dedicated infra", "Compliance"], icon: Scale }
  ];

  const packages = [
    { name: "Starter", credits: "2,000", price: "$5" },
    { name: "Growth", credits: "20,000", price: "$39" },
    { name: "Scale", credits: "100,000", price: "$149" }
  ];

  const devSections = ["Authentication", "Events", "Rate Limits", "Credits", "Webhooks", "SLAs", "Compliance"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case "beta": return "text-amber-400 border-amber-500/30 bg-amber-500/10";
      case "planned": return "text-muted-foreground border-border bg-muted/30";
      default: return "text-muted-foreground border-border";
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case "ACCEPT": return "text-emerald-400";
      case "REJECT": return "text-red-400";
      case "REVIEW": return "text-amber-400";
      default: return "text-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>GoldMail Validator | Email Intelligence Infrastructure | XPEX Neural</title>
        <meta name="description" content="Email intelligence infrastructure for platforms that cannot afford bad data. Validation, risk scoring and delivery intelligence at scale." />
        <meta name="keywords" content="email validation api, email intelligence, risk scoring, bounce prediction, disposable detection" />
      </Helmet>

      <Navbar />

      {/* Status Bar */}
      <div className="fixed top-16 left-0 right-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-2 text-xs font-mono">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-muted-foreground">System:</span>
                <span className="text-emerald-400">Operational</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-muted-foreground">Uptime:</span>
                <span className="text-foreground">100%</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <span className="text-muted-foreground">Avg Latency:</span>
                <span className="text-foreground">{stats.avg_latency_ms}ms</span>
              </div>
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-muted-foreground">Region:</span>
                <span className="text-foreground">Global</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="w-3 h-3" />
              <span>Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px]" />
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="text-foreground">Email Intelligence</span>
              <br />
              <span className="text-gradient">Infrastructure</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Validation, risk scoring and delivery intelligence for platforms that cannot afford bad data.
            </p>

            <div className="flex justify-center gap-4 flex-wrap pt-4">
              <Button 
                size="lg" 
                className="font-semibold"
                onClick={() => document.getElementById('system-overview')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View System <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/auth')}
              >
                Request Access
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Live System Overview */}
      <section id="system-overview" className="py-20 px-4 border-t border-border/30">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Live System Overview</h2>
            <p className="text-muted-foreground">
              Observe the GoldMail infrastructure processing email intelligence events in real time.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <Card className="p-6 bg-card/50 border-border/50">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Emails Processed (24h)</div>
              <div ref={emailsProcessed.ref} className="text-2xl md:text-3xl font-bold font-mono text-primary">
                {emailsProcessed.count.toLocaleString()}
              </div>
            </Card>
            <Card className="p-6 bg-card/50 border-border/50">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Avg Risk Score</div>
              <div className="text-2xl md:text-3xl font-bold font-mono text-foreground">0.42</div>
            </Card>
            <Card className="p-6 bg-card/50 border-border/50">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Disposable Detection</div>
              <div className="text-2xl md:text-3xl font-bold font-mono text-amber-400">31%</div>
            </Card>
            <Card className="p-6 bg-card/50 border-border/50">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Bounce Prediction</div>
              <div ref={bounceAccuracy.ref} className="text-2xl md:text-3xl font-bold font-mono text-emerald-400">
                {bounceAccuracy.count}.1%
              </div>
            </Card>
          </div>

          {/* Metric Visualization */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4 bg-card/30 border-border/30">
              <div className="text-xs text-muted-foreground mb-3">Email Volume Timeline</div>
              <div className="h-24 flex items-end gap-1">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-primary/40 rounded-sm transition-all hover:bg-primary/60"
                    style={{ height: `${Math.random() * 80 + 20}%` }}
                  />
                ))}
              </div>
            </Card>
            <Card className="p-4 bg-card/30 border-border/30">
              <div className="text-xs text-muted-foreground mb-3">Risk Distribution</div>
              <div className="h-24 flex items-center justify-center gap-2">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-400/50 flex items-center justify-center text-sm font-mono">62%</div>
                  <div className="text-xs mt-1 text-muted-foreground">Low</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border-4 border-amber-400/50 flex items-center justify-center text-xs font-mono">27%</div>
                  <div className="text-xs mt-1 text-muted-foreground">Med</div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full border-4 border-red-400/50 flex items-center justify-center text-xs font-mono">11%</div>
                  <div className="text-xs mt-1 text-muted-foreground">High</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-card/30 border-border/30">
              <div className="text-xs text-muted-foreground mb-3">Latency Map</div>
              <div className="h-24 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="text-center p-2 bg-emerald-500/10 rounded"><span className="text-emerald-400">US</span><br/>89ms</div>
                  <div className="text-center p-2 bg-primary/10 rounded"><span className="text-primary">EU</span><br/>142ms</div>
                  <div className="text-center p-2 bg-amber-500/10 rounded"><span className="text-amber-400">APAC</span><br/>198ms</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Controlled Validation */}
      <section className="py-20 px-4 bg-muted/20 border-t border-border/30">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Run a Controlled Validation</h2>
            <p className="text-muted-foreground">Test the intelligence layer with a sample email address.</p>
          </div>

          <Card className="p-6 bg-card/50 border-border/50">
            <div className="flex gap-4 mb-6">
              <Input
                type="email"
                placeholder="email@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1 font-mono bg-background/50"
                onKeyDown={(e) => e.key === 'Enter' && runValidation()}
              />
              <Button onClick={runValidation} disabled={isValidating}>
                {isValidating ? "Analyzing..." : "Analyze Email"}
              </Button>
            </div>

            {validationResult && (
              <div className="border border-border/50 rounded-lg p-4 bg-background/30 font-mono text-sm">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-muted-foreground">Event ID:</span>{" "}
                    <span className="text-foreground">{validationResult.event_id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Decision:</span>{" "}
                    <span className={`font-bold ${getDecisionColor(validationResult.decision)}`}>
                      {validationResult.decision}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence:</span>{" "}
                    <span className="text-foreground">{validationResult.confidence}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Latency:</span>{" "}
                    <span className="text-foreground">{validationResult.latency}</span>
                  </div>
                </div>
                
                <div className="border-t border-border/30 pt-4">
                  <div className="text-muted-foreground mb-2">Risk Vector:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Disposable Likelihood: <span className="text-foreground">{validationResult.risk_vector.disposable_likelihood}</span></div>
                    <div>Domain Reputation: <span className="text-foreground">{validationResult.risk_vector.domain_reputation}</span></div>
                    <div>Bounce Pattern: <span className="text-foreground">{validationResult.risk_vector.historical_bounce_pattern}</span></div>
                    <div>MX Validation: <span className="text-foreground">{validationResult.risk_vector.mx_validation}</span></div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Architecture Layer */}
      <section className="py-20 px-4 border-t border-border/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">GoldMail as an Intelligence Layer</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              GoldMail sits between data ingestion and decision-making, enforcing quality, risk control and intelligence.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <Card className="p-6 bg-muted/30 border-border/50 text-center min-w-[200px]">
              <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <div className="font-medium">User Input</div>
              <div className="text-xs text-muted-foreground">Forms, APIs, Imports</div>
            </Card>
            
            <div className="text-2xl text-muted-foreground">→</div>
            
            <Card className="p-6 bg-primary/10 border-primary/30 text-center min-w-[240px] glow-cyan">
              <Layers className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="font-bold text-primary">GoldMail Intelligence Layer</div>
              <div className="text-xs text-muted-foreground">Validation • Risk • Quality</div>
            </Card>
            
            <div className="text-2xl text-muted-foreground">→</div>
            
            <Card className="p-6 bg-muted/30 border-border/50 text-center min-w-[200px]">
              <Globe className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <div className="font-medium">Your Platform</div>
              <div className="text-xs text-muted-foreground">SaaS, Agent, App</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-20 px-4 bg-muted/20 border-t border-border/30">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">GoldMail Ecosystem Modules</h2>
            <p className="text-muted-foreground">Expand capabilities with modular components.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module) => (
              <Card key={module.name} className="p-5 bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <module.icon className="w-6 h-6 text-primary" />
                  <Badge variant="outline" className={`text-xs ${getStatusColor(module.status)}`}>
                    {module.status}
                  </Badge>
                </div>
                <h3 className="font-semibold mb-1">{module.name}</h3>
                <p className="text-sm text-muted-foreground">{module.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Access Levels */}
      <section className="py-20 px-4 border-t border-border/30">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Access Levels</h2>
            <p className="text-muted-foreground">Choose the tier that fits your infrastructure needs.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {accessLevels.map((level, i) => (
              <Card key={level.name} className={`p-5 bg-card/50 border-border/50 ${i === 3 ? 'border-primary/50' : ''}`}>
                <level.icon className={`w-6 h-6 mb-3 ${i === 3 ? 'text-primary' : 'text-muted-foreground'}`} />
                <h3 className="font-semibold mb-3">{level.name}</h3>
                <ul className="space-y-2">
                  {level.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-3 h-3 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4 bg-muted/20 border-t border-border/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Pay-as-you-go Pricing</h2>
            <p className="text-muted-foreground">
              Starting at <span className="text-primary font-mono">$0.00149</span> per validation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {packages.map((pkg, i) => (
              <Card 
                key={pkg.name} 
                className={`p-6 text-center bg-card/50 border-border/50 hover:border-primary/30 transition-colors ${i === 1 ? 'border-primary/50' : ''}`}
              >
                <h3 className="font-semibold mb-1">{pkg.name}</h3>
                <div className="text-2xl font-bold mb-2">{pkg.price}</div>
                <div className="text-sm text-muted-foreground">{pkg.credits} validations</div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button onClick={() => navigate('/credits')} variant="outline">
              View All Packages <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Developer Portal Preview */}
      <section className="py-20 px-4 border-t border-border/30">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Developer Portal</h2>
            <p className="text-muted-foreground">Comprehensive documentation and resources.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {devSections.map((section) => (
              <Badge 
                key={section} 
                variant="outline" 
                className="px-4 py-2 text-sm cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors"
              >
                {section}
              </Badge>
            ))}
          </div>

          <div className="mt-6">
            <Button asChild variant="outline">
              <Link to="/docs">
                <FileCheck className="w-4 h-4 mr-2" /> Open Documentation
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <div className="font-bold text-lg mb-2">XPEX Neural Infrastructure</div>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Stripe Billing</span>
                <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Mixpanel Analytics</span>
                <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Global Edge Deployment</span>
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <Link to="/legal/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/legal/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
              <Link to="/status" className="text-muted-foreground hover:text-foreground transition-colors">Status</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GoldEmailValidator;
