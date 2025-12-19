import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Network, Zap, Shield, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const BridgeScan = () => {
  const [apiUrl, setApiUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScan = async () => {
    if (!apiUrl) return;
    setScanning(true);
    // Simulated scan result
    await new Promise((r) => setTimeout(r, 2000));
    setResult({
      url: apiUrl,
      status: 'healthy',
      latency: 45,
      endpoints: 12,
      security_score: 92,
    });
    setScanning(false);
  };

  return (
    <>
      <Helmet>
        <title>BridgeScan - API Discovery & Analysis | XPEX AI</title>
        <meta
          name="description"
          content="Escaneie e analise pontes de dados e conexões API com BridgeScan."
        />
      </Helmet>

      <main className="min-h-screen bg-background text-foreground">
        <Navbar />

        {/* Hero */}
        <section className="pt-32 pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 text-yellow-500 border-yellow-500/30">
                <Zap className="w-3 h-3 mr-1" /> Beta
              </Badge>

              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-foreground">Bridge</span>
                <span className="text-gradient">Scan</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Escaneamento inteligente de pontes de dados e conexões API. Descubra, mapeie e
                monitore seus endpoints.
              </p>

              {/* Demo Scanner */}
              <Card className="p-8 bg-card/50 backdrop-blur border-border/50 max-w-2xl mx-auto">
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="https://api.exemplo.com"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleScan} disabled={scanning || !apiUrl}>
                    {scanning ? (
                      <>
                        <Network className="w-4 h-4 mr-2 animate-spin" /> Escaneando...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" /> Escanear
                      </>
                    )}
                  </Button>
                </div>

                {result && (
                  <div className="text-left space-y-4 p-4 rounded-lg bg-background/50">
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-semibold">Scan Completo</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 rounded-lg bg-secondary/50">
                        <div className="text-2xl font-bold text-primary">{result.latency}ms</div>
                        <div className="text-xs text-muted-foreground">Latência</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-secondary/50">
                        <div className="text-2xl font-bold text-primary">{result.endpoints}</div>
                        <div className="text-xs text-muted-foreground">Endpoints</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-secondary/50">
                        <div className="text-2xl font-bold text-green-500">
                          {result.security_score}%
                        </div>
                        <div className="text-xs text-muted-foreground">Segurança</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-secondary/50">
                        <div className="text-2xl font-bold text-green-500">Healthy</div>
                        <div className="text-xs text-muted-foreground">Status</div>
                      </div>
                    </div>
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
                  icon: Network,
                  title: 'API Discovery',
                  description: 'Descubra automaticamente todos os endpoints disponíveis.',
                },
                {
                  icon: Shield,
                  title: 'Security Analysis',
                  description: 'Análise de vulnerabilidades e scoring de segurança.',
                },
                {
                  icon: Zap,
                  title: 'Performance Metrics',
                  description: 'Métricas de latência, uptime e disponibilidade.',
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

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Pronto para mapear suas APIs?</h2>
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

export default BridgeScan;
