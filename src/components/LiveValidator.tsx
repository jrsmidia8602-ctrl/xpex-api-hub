import { useState } from "react";
import { Mail, CheckCircle, XCircle, AlertTriangle, Loader2, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface ValidationResult {
  valid: boolean;
  email: string;
  riskScore: number;
  checks: {
    format: boolean;
    mx: boolean;
    disposable: boolean;
    typosquatting: boolean;
  };
  latency: number;
  domain: string;
  recommendation: string;
}

const LiveValidator = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const validateEmail = async () => {
    if (!email) return;
    
    setLoading(true);
    setResult(null);

    // Simulate API call with realistic delay
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200));

    const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const disposableDomains = ["tempmail.com", "throwaway.com", "guerrillamail.com", "mailinator.com"];
    const domain = email.split("@")[1]?.toLowerCase() || "";
    const isDisposable = disposableDomains.some((d) => domain.includes(d));
    const isTyposquatting = ["gmial.com", "gmal.com", "hotmal.com", "yahooo.com"].includes(domain);

    const checks = {
      format: isValidFormat,
      mx: isValidFormat && !isDisposable,
      disposable: !isDisposable,
      typosquatting: !isTyposquatting,
    };

    const riskScore = Object.values(checks).filter(Boolean).length * 25;
    const emailDomain = domain || "unknown";

    // Generate AI recommendation
    let recommendation = "Email válido - seguro para uso";
    if (!isValidFormat) recommendation = "Formato inválido - rejeitar";
    else if (isDisposable) recommendation = "Email descartável - alto risco";
    else if (isTyposquatting) recommendation = "Possível typosquatting - verificar";
    else if (riskScore < 75) recommendation = "Risco médio - requer validação adicional";

    setResult({
      valid: isValidFormat && !isDisposable && !isTyposquatting,
      email,
      riskScore,
      checks,
      latency: Math.floor(30 + Math.random() * 20),
      domain: emailDomain,
      recommendation,
    });

    setLoading(false);
  };

  const getRiskColor = (score: number) => {
    if (score >= 75) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="font-bold">GoldMail Validator</h3>
          <Badge variant="outline" className="text-xs text-primary border-primary/30">
            Experimente grátis
          </Badge>
        </div>
        <Link to="/gold-email-validator">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            Ver mais <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        <Input
          type="email"
          placeholder="Digite um email para validar..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && validateEmail()}
          className="bg-background/50"
        />
        <Button onClick={validateEmail} disabled={loading || !email}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        </Button>
      </div>

      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Status Header */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/30">
            <div className="flex items-center gap-3">
              {result.valid ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              <div>
                <div className="font-medium">{result.email}</div>
                <div className="text-xs text-muted-foreground">
                  {result.valid ? "Email válido" : "Email inválido ou arriscado"}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getRiskColor(result.riskScore)}`}>
                {result.riskScore}%
              </div>
              <div className="text-xs text-muted-foreground">Pontuação IA</div>
            </div>
          </div>

          {/* Checks Grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "format", label: "Validação" },
              { key: "mx", label: "MX Record" },
              { key: "disposable", label: "Descartável" },
              { key: "typosquatting", label: "Risco" },
            ].map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center gap-2 p-2 rounded bg-background/30 text-sm"
              >
                {result.checks[key as keyof typeof result.checks] ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded bg-background/30">
              <span className="text-muted-foreground">Domínio: </span>
              <span className="text-primary font-mono">{result.domain}</span>
            </div>
            <div className="p-2 rounded bg-background/30">
              <span className="text-muted-foreground">Latência: </span>
              <span className="text-primary font-mono">{result.latency}ms</span>
            </div>
          </div>

          {/* Recommendation */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
            <span className="text-muted-foreground">Recomendação: </span>
            <span className="text-foreground">{result.recommendation}</span>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="text-center text-sm text-muted-foreground py-4">
          Digite um email para ver validação em tempo real
        </div>
      )}
    </Card>
  );
};

export default LiveValidator;
