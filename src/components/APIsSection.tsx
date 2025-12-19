import APICard from "./APICard";
import { Mail, Sparkles, ShoppingCart, Shield, Globe, Link } from "lucide-react";

const apis = [
  {
    name: "GoldMail Validator",
    description: "Validação profissional de email com detecção de descartáveis, scoring de risco e verificação MX.",
    icon: Mail,
    price: "A partir de $0.001/chamada",
    color: "cyan" as const,
    featured: true,
  },
  {
    name: "Bridge Scan",
    description: "Verifique se emails ou domínios aparecem em vazamentos de dados.",
    icon: Shield,
    price: "$0.01/chamada",
    color: "orange" as const,
  },
  {
    name: "IP Insight",
    description: "Geolocalização, detecção de VPN/proxy, análise de ameaças.",
    icon: Globe,
    price: "$0.008/chamada",
    color: "pink" as const,
  },
  {
    name: "Link Magic",
    description: "Verificação em lote de saúde de URLs e monitoramento de uptime.",
    icon: Link,
    price: "$0.005/chamada",
    color: "cyan" as const,
  },
  {
    name: "Copy Vorals",
    description: "Gere copy viral e de alta conversão com IA.",
    icon: Sparkles,
    price: "$0.03/chamada",
    color: "purple" as const,
  },
  {
    name: "Extrair Produtos",
    description: "Scraping estruturado de qualquer marketplace.",
    icon: ShoppingCart,
    price: "$0.005/chamada",
    color: "green" as const,
  },
];

const APIsSection = () => {
  return (
    <section id="apis" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Portfólio de</span>{" "}
            <span className="text-gradient">APIs</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            APIs prontas para produção que empresas, IAs e agentes autônomos descobrem e pagam automaticamente.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {apis.map((api, index) => (
            <div
              key={api.name}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <APICard {...api} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default APIsSection;
