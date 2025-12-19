import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote: "A validação de emails da XPEX reduziu nossa taxa de bounce em 87%. Integração simples e resultados impressionantes.",
    author: "Maria Silva",
    role: "Head of Marketing",
    company: "TechFlow Brasil",
    avatar: "MS",
    rating: 5,
  },
  {
    quote: "Processamos milhões de validações por mês. A latência de menos de 50ms é crucial para nossa operação em tempo real.",
    author: "Carlos Oliveira",
    role: "CTO",
    company: "DataStream",
    avatar: "CO",
    rating: 5,
  },
  {
    quote: "O suporte enterprise é excepcional. A equipe XPEX nos ajudou a otimizar nossa integração e reduzimos custos em 40%.",
    author: "Ana Costa",
    role: "VP of Engineering",
    company: "Fintech Labs",
    avatar: "AC",
    rating: 5,
  },
];

const companies = [
  { name: "TechFlow", initial: "TF" },
  { name: "DataStream", initial: "DS" },
  { name: "Fintech Labs", initial: "FL" },
  { name: "CloudScale", initial: "CS" },
  { name: "NeoBank", initial: "NB" },
  { name: "AI Ventures", initial: "AV" },
];

const Testimonials = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Empresas que</span>{" "}
            <span className="text-gradient">Confiam</span>{" "}
            <span className="text-foreground">em Nós</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Milhares de empresas usam XPEX Neural para validar emails, 
            prevenir fraudes e otimizar suas operações.
          </p>
        </div>

        {/* Company Logos */}
        <div className="flex flex-wrap justify-center gap-8 mb-16">
          {companies.map((company, index) => (
            <div
              key={company.name}
              className="flex items-center justify-center w-24 h-24 rounded-2xl bg-secondary/30 border border-border/30 hover:border-primary/50 transition-all duration-300 hover:scale-110 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className="text-2xl font-bold text-gradient">{company.initial}</span>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className="relative card-cyber rounded-3xl p-8 transition-all duration-500 hover:scale-105 animate-fade-in"
              style={{ animationDelay: `${0.3 + index * 0.1}s` }}
            >
              {/* Quote Icon */}
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Quote className="w-6 h-6 text-primary" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground/90 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role} · {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
          {[
            { value: "500+", label: "Empresas Ativas" },
            { value: "99.9%", label: "Uptime SLA" },
            { value: "50M+", label: "Validações/Mês" },
            { value: "4.9/5", label: "Avaliação Média" },
          ].map((stat, index) => (
            <div 
              key={stat.label} 
              className="animate-fade-in"
              style={{ animationDelay: `${0.6 + index * 0.1}s` }}
            >
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

export default Testimonials;
