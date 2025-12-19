import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Shield, AlertTriangle, Database, Lock, ArrowRight, Search, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const BreachScan = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScan = async () => {
    if (!email) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setResult({
      email,
      breaches_found: 2,
      severity: 'medium',
      breaches: [
        { name: 'LinkedIn 2021', date: '2021-06-22', records: '700M', data_types: ['Email', 'Name', 'Phone'] },
        { name: 'Adobe 2013', date: '2013-10-04', records: '153M', data_types: ['Email', 'Password Hash'] },
      ],
      recommendations: ['Change passwords', 'Enable 2FA', 'Monitor accounts'],
    });
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>BreachScan - Data Breach Detection | XPEX AI</title>
        <meta
          name="description"
          content="Check if emails appear in known data breaches with severity scoring and exposure analysis."
        />
      </Helmet>

      <main className="min-h-screen bg-background text-foreground">
        <Navbar />

        {/* Hero */}
        <section className="pt-32 pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-destructive/10 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 text-primary border-primary/30">
                Security API
              </Badge>

              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-foreground">Breach</span>
                <span className="text-gradient">Scan</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Verifique se emails aparecem em vazamentos de dados conhecidos com scoring de severidade e análise de exposição.
              </p>

              {/* Demo Scan */}
              <Card className="p-8 bg-card/50 backdrop-blur border-border/50 max-w-2xl mx-auto">
                <div className="flex gap-4 mb-6">
                  <Input
                    type="email"
                    placeholder="Digite um email para verificar"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleScan} disabled={loading || !email}>
                    {loading ? (
                      <>
                        <Shield className="w-4 h-4 mr-2 animate-spin" /> Escaneando...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" /> Verificar
                      </>
                    )}
                  </Button>
                </div>

                {result && (
                  <div className="text-left space-y-4 p-4 rounded-lg bg-background/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.breaches_found > 0 ? (
                          <XCircle className="w-5 h-5 text-destructive" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                        <span className="font-semibold">{result.email}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          result.severity === 'low'
                            ? 'text-green-500 border-green-500/30'
                            : result.severity === 'medium'
                            ? 'text-yellow-500 border-yellow-500/30'
                            : 'text-destructive border-destructive/30'
                        }
                      >
                        {result.breaches_found} vazamentos
                      </Badge>
                    </div>

                    {result.breaches.map((breach: any) => (
                      <div key={breach.name} className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{breach.name}</span>
                          <span className="text-xs text-muted-foreground">{breach.date}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {breach.data_types.map((type: string) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
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
                  icon: Database,
                  title: 'Breach Database',
                  description: 'Acesso a bilhões de registros de vazamentos conhecidos.',
                },
                {
                  icon: AlertTriangle,
                  title: 'Risk Assessment',
                  description: 'Scoring de severidade baseado no tipo de dados expostos.',
                },
                {
                  icon: Lock,
                  title: 'Exposure Details',
                  description: 'Detalhes completos sobre quais dados foram comprometidos.',
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
            <p className="text-muted-foreground mb-8">$0.01 por verificação</p>
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

export default BreachScan;
