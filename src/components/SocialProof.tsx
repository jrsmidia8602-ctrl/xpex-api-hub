import { Card } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

interface Partner {
  name: string;
  logo?: string;
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  rating: number;
}

const partners: Partner[] = [
  { name: 'Stripe' },
  { name: 'Vercel' },
  { name: 'GitHub' },
  { name: 'Supabase' },
  { name: 'AWS' },
];

const testimonials: Testimonial[] = [
  {
    quote: 'A XPEX revolucionou nossa validação de emails. A precisão da IA é impressionante.',
    author: 'Carlos Silva',
    role: 'CTO',
    company: 'TechCorp Brasil',
    rating: 5,
  },
  {
    quote: 'Integramos em minutos e a taxa de bounce caiu 95%. ROI incrível.',
    author: 'Ana Rodrigues',
    role: 'Head of Growth',
    company: 'StartupX',
    rating: 5,
  },
  {
    quote: 'APIs rápidas, documentação clara, suporte excelente. Recomendo fortemente.',
    author: 'Pedro Costa',
    role: 'Dev Lead',
    company: 'FinTech Pro',
    rating: 5,
  },
];

// Trust badges for enterprise credibility
const trustBadges = [
  { label: 'SOC 2', description: 'Type II Certified' },
  { label: 'GDPR', description: 'Compliant' },
  { label: 'LGPD', description: 'Compliant' },
  { label: '99.99%', description: 'SLA Guarantee' },
];

export const SocialProof = () => {
  return (
    <section className="py-20 bg-secondary/20">
      <div className="container mx-auto px-4">
        {/* Partners */}
        <div className="text-center mb-16">
          <p className="text-sm text-muted-foreground mb-8 uppercase tracking-wider">
            Tecnologia de Parceiros Líderes
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {partners.map((partner) => (
              <div
                key={partner.name}
                className="text-2xl font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-default"
              >
                {partner.name}
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          {trustBadges.map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
            >
              <span className="font-bold text-primary">{badge.label}</span>
              <span className="text-xs text-muted-foreground">{badge.description}</span>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="p-6 bg-card/50 backdrop-blur border-border/50 relative overflow-hidden hover:border-primary/30 transition-colors"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              <p className="text-foreground mb-6 italic">"{testimonial.quote}"</p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold">
                    {testimonial.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{testimonial.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role} @ {testimonial.company}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '12.5M+', label: 'Validações' },
            { value: '99.9%', label: 'Uptime' },
            { value: '47ms', label: 'Latência Média' },
            { value: '5000+', label: 'Empresas' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
