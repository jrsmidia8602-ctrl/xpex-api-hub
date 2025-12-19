import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Zap, Key, BarChart3, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao XPEX Neural!",
    description: "Sua plataforma de APIs inteligentes para validação de dados. Vamos mostrar as principais funcionalidades.",
    icon: Zap,
    features: ["APIs de alta performance", "Validação em tempo real", "Inteligência artificial integrada"],
  },
  {
    id: "api-keys",
    title: "Gerenciar API Keys",
    description: "Crie e gerencie suas chaves de API para acessar nossos serviços de forma segura.",
    icon: Key,
    features: ["Múltiplas chaves por conta", "Controle de permissões", "Monitoramento de uso"],
  },
  {
    id: "dashboard",
    title: "Dashboard Analítico",
    description: "Acompanhe métricas em tempo real e analise o desempenho das suas validações.",
    icon: BarChart3,
    features: ["Gráficos interativos", "Métricas de latência", "Histórico de chamadas"],
  },
  {
    id: "security",
    title: "Segurança Avançada",
    description: "Proteja seus dados com nossa infraestrutura de segurança enterprise.",
    icon: Shield,
    features: ["Criptografia end-to-end", "Rate limiting", "Logs de auditoria"],
  },
  {
    id: "ai",
    title: "IA Integrada",
    description: "Utilize inteligência artificial para validações mais precisas e insights automáticos.",
    icon: Sparkles,
    features: ["Detecção de fraudes", "Sugestões inteligentes", "Análise preditiva"],
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("xpex-onboarding-complete");
    if (!hasSeenTour) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem("xpex-onboarding-complete", "true");
    setIsOpen(false);
    onComplete?.();
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const StepIcon = step.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 border-primary/30 shadow-lg shadow-primary/10">
        <CardHeader className="relative pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <StepIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <Progress value={progress} className="h-1" />
              <p className="text-xs text-muted-foreground mt-1">
                Passo {currentStep + 1} de {tourSteps.length}
              </p>
            </div>
          </div>
          <CardTitle className="text-xl">{step.title}</CardTitle>
          <CardDescription className="text-base">{step.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-3 mb-6">
            {step.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Pular tour
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
              )}
              <Button variant="neon" size="sm" onClick={handleNext}>
                {currentStep === tourSteps.length - 1 ? "Concluir" : "Próximo"}
                {currentStep < tourSteps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function useOnboardingTour() {
  const [showTour, setShowTour] = useState(false);

  const startTour = () => {
    localStorage.removeItem("xpex-onboarding-complete");
    setShowTour(true);
  };

  const resetTour = () => {
    localStorage.removeItem("xpex-onboarding-complete");
  };

  return { showTour, setShowTour, startTour, resetTour };
}
