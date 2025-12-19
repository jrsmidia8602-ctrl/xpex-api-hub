import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, Shield, BarChart3, Zap, ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const LinkMagic = () => {
  return (
    <>
      <Helmet>
        <title>LinkMagic - Advanced Link Management | XPEX AI</title>
        <meta
          name="description"
          content="Gestão e validação avançada de links com tracking e análise de segurança."
        />
      </Helmet>

      <main className="min-h-screen bg-background text-foreground">
        <Navbar />

        {/* Hero */}
        <section className="pt-32 pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 text-muted-foreground border-border">
                <Clock className="w-3 h-3 mr-1" /> Em Breve
              </Badge>

              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-foreground">Link</span>
                <span className="text-gradient">Magic</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Gestão inteligente de links com validação, tracking de redirects e análise de
                segurança em tempo real.
              </p>

              {/* Coming Soon Card */}
              <Card className="p-12 bg-card/50 backdrop-blur border-border/50 max-w-2xl mx-auto">
                <div className="flex items-center justify-center mb-6">
                  <div className="p-6 rounded-full bg-primary/10">
                    <Link2 className="w-12 h-12 text-primary" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-4">Estamos Trabalhando Nisso</h2>
                <p className="text-muted-foreground mb-8">
                  LinkMagic está em desenvolvimento ativo. Entre na lista de espera para ser
                  notificado quando lançarmos.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <Link to="/auth">
                      Entrar na Lista de Espera <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/">Ver Outras APIs</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Planned Features */}
        <section className="py-20 bg-secondary/20">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-12">Funcionalidades Planejadas</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Link2,
                  title: 'Link Validation',
                  description: 'Validação em tempo real de URLs com detecção de broken links.',
                },
                {
                  icon: Shield,
                  title: 'Safety Check',
                  description: 'Análise de segurança para detectar links maliciosos e phishing.',
                },
                {
                  icon: BarChart3,
                  title: 'Analytics',
                  description: 'Métricas detalhadas de cliques, redirects e performance.',
                },
              ].map((feature) => (
                <Card
                  key={feature.title}
                  className="p-6 bg-card/50 backdrop-blur border-border/50 opacity-75"
                >
                  <feature.icon className="w-10 h-10 text-primary/50 mb-4" />
                  <h3 className="text-lg font-bold mb-2 text-muted-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground/70">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
};

export default LinkMagic;
