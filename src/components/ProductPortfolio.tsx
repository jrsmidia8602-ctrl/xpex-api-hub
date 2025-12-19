import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Network, Globe, Link2, Sparkles } from 'lucide-react';
import { analytics } from '@/lib/analytics';

interface Product {
  name: string;
  description: string;
  cta: string;
  icon: React.ElementType;
  features: string[];
  status: 'live' | 'beta' | 'coming-soon';
}

const products: Product[] = [
  {
    name: 'GoldMail Validator',
    description: 'Validação de emails premium com scoring, MX/SMTP e inteligência de IA',
    cta: '/products/gold-email-validator',
    icon: Mail,
    features: ['AI Risk Scoring', 'MX/SMTP Check', 'Typo Detection'],
    status: 'live',
  },
  {
    name: 'BridgeScan',
    description: 'Escaneamento de pontes de dados e conexões API',
    cta: '/products/bridgescan',
    icon: Network,
    features: ['API Discovery', 'Data Bridge Analysis', 'Connection Mapping'],
    status: 'beta',
  },
  {
    name: 'IP Insight',
    description: 'Informações avançadas sobre IPs e reputação de rede',
    cta: '/products/ip-insight',
    icon: Globe,
    features: ['IP Geolocation', 'Threat Detection', 'Network Analysis'],
    status: 'beta',
  },
  {
    name: 'LinkMagic',
    description: 'Gestão e validação avançada de links',
    cta: '/products/link-magic',
    icon: Link2,
    features: ['Link Validation', 'Redirect Tracking', 'Safety Check'],
    status: 'coming-soon',
  },
];

const statusColors = {
  live: 'bg-green-500/10 text-green-500 border-green-500/30',
  beta: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  'coming-soon': 'bg-muted text-muted-foreground border-border',
};

const statusLabels = {
  live: 'Live',
  beta: 'Beta',
  'coming-soon': 'Em breve',
};

export const ProductPortfolio = () => {
  return (
    <section className="py-24 relative overflow-hidden" id="portfolio">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Portfólio de APIs</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Nosso </span>
            <span className="text-gradient">Ecossistema</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            APIs e agentes autônomos que trabalham para você. Monetize com precisão.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card
              key={product.name}
              className="group p-6 bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <product.icon className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="outline" className={statusColors[product.status]}>
                  {statusLabels[product.status]}
                </Badge>
              </div>

              <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{product.description}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {product.features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>

              {product.status !== 'coming-soon' ? (
                <Button
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                  asChild
                  onClick={() => analytics.trackCTAClick(`experimente_${product.name}`, 'portfolio')}
                >
                  <Link to={product.cta}>
                    Experimente
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Em breve
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductPortfolio;
