import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Globe, Shield, MapPin, Wifi, ArrowRight, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const IPInsight = () => {
  const [ip, setIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleLookup = async () => {
    if (!ip) return;
    setLoading(true);
    // Simulated lookup
    await new Promise((r) => setTimeout(r, 1500));
    setResult({
      ip,
      country: 'Brasil',
      city: 'São Paulo',
      isp: 'Vivo Fibra',
      risk_level: 'low',
      risk_score: 12,
      threats: [],
      is_vpn: false,
      is_proxy: false,
    });
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>IP Insight - Advanced IP Intelligence | XPEX AI</title>
        <meta
          name="description"
          content="Informações avançadas sobre IPs, geolocalização e reputação de rede."
        />
      </Helmet>

      <main className="min-h-screen bg-background text-foreground">
        <Navbar />

        {/* Hero */}
        <section className="pt-32 pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 text-yellow-500 border-yellow-500/30">
                Beta
              </Badge>

              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-foreground">IP </span>
                <span className="text-gradient">Insight</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Inteligência avançada de IP com geolocalização, detecção de ameaças e análise de
                reputação de rede.
              </p>

              {/* Demo Lookup */}
              <Card className="p-8 bg-card/50 backdrop-blur border-border/50 max-w-2xl mx-auto">
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="Digite um IP (ex: 8.8.8.8)"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleLookup} disabled={loading || !ip}>
                    {loading ? (
                      <>
                        <Globe className="w-4 h-4 mr-2 animate-spin" /> Analisando...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" /> Analisar
                      </>
                    )}
                  </Button>
                </div>

                {result && (
                  <div className="text-left space-y-4 p-4 rounded-lg bg-background/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="font-semibold">IP: {result.ip}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          result.risk_level === 'low'
                            ? 'text-green-500 border-green-500/30'
                            : 'text-red-500 border-red-500/30'
                        }
                      >
                        Risco: {result.risk_score}%
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <MapPin className="w-4 h-4 text-primary mb-1" />
                        <div className="text-sm font-medium">{result.city}</div>
                        <div className="text-xs text-muted-foreground">{result.country}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <Wifi className="w-4 h-4 text-primary mb-1" />
                        <div className="text-sm font-medium">{result.isp}</div>
                        <div className="text-xs text-muted-foreground">ISP</div>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <Shield className="w-4 h-4 text-green-500 mb-1" />
                        <div className="text-sm font-medium">
                          {result.is_vpn ? 'Sim' : 'Não'}
                        </div>
                        <div className="text-xs text-muted-foreground">VPN</div>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <AlertTriangle className="w-4 h-4 text-green-500 mb-1" />
                        <div className="text-sm font-medium">
                          {result.threats.length || 'Nenhuma'}
                        </div>
                        <div className="text-xs text-muted-foreground">Ameaças</div>
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
                  icon: MapPin,
                  title: 'Geolocalização Precisa',
                  description: 'Localização em tempo real com cidade, região e país.',
                },
                {
                  icon: Shield,
                  title: 'Threat Detection',
                  description: 'Detecção de VPN, proxy, tor e atividades maliciosas.',
                },
                {
                  icon: Globe,
                  title: 'Network Intelligence',
                  description: 'Informações de ISP, ASN e reputação de rede.',
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
            <h2 className="text-3xl font-bold mb-6">Proteja seu negócio com IP Intelligence</h2>
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

export default IPInsight;
