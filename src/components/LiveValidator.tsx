import { useState } from "react";
import { Mail, CheckCircle, XCircle, AlertTriangle, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

    setResult({
      valid: isValidFormat && !isDisposable && !isTyposquatting,
      email,
      riskScore,
      checks,
      latency: Math.floor(30 + Math.random() * 20),
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
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-primary" />
        <h3 className="font-bold">Live Email Validator</h3>
        <Badge variant="outline" className="text-xs text-primary border-primary/30">
          Try it free
        </Badge>
      </div>

      <div className="flex gap-2 mb-6">
        <Input
          type="email"
          placeholder="Enter email to validate..."
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
                  {result.valid ? "Valid email address" : "Invalid or risky email"}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getRiskColor(result.riskScore)}`}>
                {result.riskScore}%
              </div>
              <div className="text-xs text-muted-foreground">Trust Score</div>
            </div>
          </div>

          {/* Checks */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "format", label: "Format Valid" },
              { key: "mx", label: "MX Records" },
              { key: "disposable", label: "Not Disposable" },
              { key: "typosquatting", label: "No Typosquatting" },
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

          {/* Latency */}
          <div className="text-center text-xs text-muted-foreground">
            Response time: <span className="text-primary font-mono">{result.latency}ms</span>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="text-center text-sm text-muted-foreground py-4">
          Enter an email address to see real-time validation
        </div>
      )}
    </Card>
  );
};

export default LiveValidator;
