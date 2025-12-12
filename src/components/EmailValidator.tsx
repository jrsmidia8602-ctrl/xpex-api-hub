import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle2, XCircle, AlertTriangle, Loader2, Shield, Server, Clock } from "lucide-react";

interface ValidationResult {
  email: string;
  valid: boolean;
  score: number;
  disposable: boolean;
  mx_found: boolean;
  format_valid: boolean;
  domain: string;
  risk_level: "low" | "medium" | "high";
  suggestions?: string[];
}

const EmailValidator = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const validateEmail = async () => {
    if (!email.trim()) return;
    
    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const domain = email.split("@")[1] || "";
    const isDisposable = ["tempmail.com", "guerrillamail.com", "10minutemail.com", "mailinator.com"].some(d => domain.includes(d));
    
    const mockResult: ValidationResult = {
      email,
      valid: isValid && !isDisposable,
      score: isValid ? (isDisposable ? 35 : 92) : 10,
      disposable: isDisposable,
      mx_found: isValid && !isDisposable,
      format_valid: isValid,
      domain,
      risk_level: isDisposable ? "high" : isValid ? "low" : "medium",
      suggestions: isValid ? undefined : ["Check for typos", "Verify the domain exists"],
    };
    
    setResult(mockResult);
    setIsLoading(false);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "text-neon-green";
      case "medium": return "text-neon-orange";
      case "high": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-neon-green";
    if (score >= 50) return "text-neon-orange";
    return "text-destructive";
  };

  return (
    <section id="validator" className="py-24 relative">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
            <Mail className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Live Demo</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Gold Email</span>{" "}
            <span className="text-gradient">Validator</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Test our flagship API. Professional validation with risk scoring, 
            MX verification, and disposable email detection.
          </p>
        </div>

        {/* Validator Card */}
        <div className="max-w-2xl mx-auto">
          <div className="card-cyber rounded-3xl p-8 border-glow">
            {/* Input Area */}
            <div className="flex gap-4 mb-8">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter email to validate..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && validateEmail()}
                  className="pl-12 h-14 bg-background/50 border-border/50 text-lg font-mono focus:border-primary/50"
                />
              </div>
              <Button
                onClick={validateEmail}
                disabled={isLoading || !email.trim()}
                variant="cyber"
                size="lg"
                className="h-14 px-8"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Validate"
                )}
              </Button>
            </div>

            {/* Results */}
            {result && (
              <div className="space-y-6 animate-fade-in">
                {/* Main Status */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    {result.valid ? (
                      <CheckCircle2 className="w-8 h-8 text-neon-green" />
                    ) : (
                      <XCircle className="w-8 h-8 text-destructive" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {result.valid ? "Valid Email" : "Invalid Email"}
                      </p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {result.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold font-mono ${getScoreColor(result.score)}`}>
                      {result.score}
                    </p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/30 text-center">
                    <Shield className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
                    <p className={`font-semibold capitalize ${getRiskColor(result.risk_level)}`}>
                      {result.risk_level}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30 text-center">
                    <Server className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground mb-1">MX Records</p>
                    <p className={`font-semibold ${result.mx_found ? "text-neon-green" : "text-destructive"}`}>
                      {result.mx_found ? "Found" : "Not Found"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30 text-center">
                    <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground mb-1">Disposable</p>
                    <p className={`font-semibold ${result.disposable ? "text-destructive" : "text-neon-green"}`}>
                      {result.disposable ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30 text-center">
                    <Clock className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground mb-1">Response</p>
                    <p className="font-semibold text-primary">42ms</p>
                  </div>
                </div>

                {/* Raw Response */}
                <div className="rounded-xl bg-background/50 p-4 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-2 font-mono">API Response</p>
                  <pre className="text-xs text-foreground/80 font-mono overflow-x-auto">
{JSON.stringify({
  ok: true,
  data: result,
  credits_used: 1,
  remaining_credits: 99
}, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!result && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Enter an email address to see the validation results</p>
                <p className="text-sm mt-2">Try: test@gmail.com or fake@tempmail.com</p>
              </div>
            )}
          </div>

          {/* API Code Example */}
          <div className="mt-8 rounded-xl bg-card/50 p-6 border border-border/30">
            <p className="text-sm text-muted-foreground mb-3">Quick Integration</p>
            <pre className="text-sm font-mono text-primary/90 overflow-x-auto">
{`curl -X POST https://api.xpex.dev/validate \\
  -H "X-API-Key: your_key" \\
  -d '{"email": "${email || "user@example.com"}"}'`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmailValidator;
