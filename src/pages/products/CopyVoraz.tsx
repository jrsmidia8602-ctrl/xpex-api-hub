import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Zap, Sparkles, Target, TrendingUp, ArrowRight, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const CopyVoraz = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setResults([
      '🚀 Descubra o segredo que 97% dos empreendedores não conhecem...',
      '⚡ Pare de perder dinheiro! Esta estratégia triplicou meu faturamento em 30 dias',
      '🔥 [URGENTE] Vagas limitadas para o método que está revolucionando o mercado',
    ]);
    setLoading(false);
  };

  const handleCopy = (index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      <Helmet>
        <title>CopyVoraz - AI Viral Copy Generator | XPEX AI</title>
        <meta
          name="description"
          content="AI-powered viral copy generation for marketing campaigns. Generate headlines that convert."
        />
      </Helmet>

      <main className="min-h-screen bg-background text-foreground">
        <Navbar />

        {/* Hero */}
        <section className="pt-32 pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 text-primary border-primary/30">
                AI Copywriting
              </Badge>

              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-foreground">Copy</span>
                <span className="text-gradient">Voraz</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Geração de copy viral com IA para campanhas de marketing. Headlines que convertem em segundos.
              </p>

              {/* Demo Generator */}
              <Card className="p-8 bg-card/50 backdrop-blur border-border/50 max-w-2xl mx-auto">
                <Textarea
                  placeholder="Descreva seu produto ou serviço... (ex: Curso de marketing digital para iniciantes)"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="mb-4 min-h-[100px]"
                />
                <Button onClick={handleGenerate} disabled={loading || !prompt} className="w-full">
                  {loading ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-pulse" /> Gerando copies virais...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" /> Gerar Copies
                    </>
                  )}
                </Button>

                {results.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {results.map((text, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-background/50 border border-border/50 text-left flex items-start justify-between gap-4"
                      >
                        <p className="text-sm">{text}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(index, text)}
                          className="shrink-0"
                        >
                          {copied === index ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-secondary/20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Sparkles,
                  title: 'Viral Headlines',
                  description: 'Headlines otimizadas para máximo engajamento e conversão.',
                },
                {
                  icon: Target,
                  title: 'Multiple Tones',
                  description: 'Adapte o tom para diferentes audiências e plataformas.',
                },
                {
                  icon: TrendingUp,
                  title: 'A/B Variants',
                  description: 'Múltiplas variações para testar e otimizar resultados.',
                },
              ].map((feature) => (
                <Card
                  key={feature.title}
                  className="p-6 bg-card/50 backdrop-blur border-border/50"
                >
                  <feature.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Preço Simples</h2>
            <p className="text-muted-foreground mb-8">$0.03 por geração</p>
            <Button size="lg" asChild>
              <Link to="/auth">
                Começar Agora <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
};

export default CopyVoraz;
