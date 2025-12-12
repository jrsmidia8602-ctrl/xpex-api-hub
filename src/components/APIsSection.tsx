import APICard from "./APICard";
import { Mail, Sparkles, ShoppingCart, Shield, Globe, Link } from "lucide-react";

const apis = [
  {
    name: "Gold Email Validator",
    description: "Professional email validation with disposable detection, risk scoring, and MX verification. Trusted by enterprises.",
    icon: Mail,
    price: "From $0.001/call",
    color: "cyan" as const,
    featured: true,
  },
  {
    name: "CopyVoraz",
    description: "Generate viral, high-conversion copy powered by AI.",
    icon: Sparkles,
    price: "$0.03/call",
    color: "purple" as const,
  },
  {
    name: "ExtrairProdutos",
    description: "Structured scraping from any marketplace.",
    icon: ShoppingCart,
    price: "$0.005/call",
    color: "green" as const,
  },
  {
    name: "BreachScan",
    description: "Check if emails or domains appear in data breaches.",
    icon: Shield,
    price: "$0.01/call",
    color: "orange" as const,
  },
  {
    name: "IPInsight",
    description: "Geolocation, VPN/proxy detection, threat analysis.",
    icon: Globe,
    price: "$0.008/call",
    color: "pink" as const,
  },
  {
    name: "LinkMedic",
    description: "Bulk URL health checking and uptime monitoring.",
    icon: Link,
    price: "$0.005/call",
    color: "cyan" as const,
  },
];

const APIsSection = () => {
  return (
    <section id="apis" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">API</span>{" "}
            <span className="text-gradient">Portfolio</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Production-ready APIs that enterprises, AIs, and autonomous agents discover and pay for automatically.
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
