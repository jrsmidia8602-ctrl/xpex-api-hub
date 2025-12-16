import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Shield, CreditCard, Lock, Server, Scale, AlertTriangle, RefreshCw, Globe } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Footer from "@/components/Footer";

const sections = [
  {
    icon: FileText,
    title: "1. Acceptance of Terms",
    text: "By accessing or using XPEX Neural, including any APIs, dashboards, documentation, or services, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform."
  },
  {
    icon: Server,
    title: "2. Description of Services",
    text: "XPEX Neural provides API-based services, agent-ready infrastructure, validation tools, and autonomous digital products. Services may include free, paid, subscription-based, or usage-based plans."
  },
  {
    icon: Lock,
    title: "3. Account Registration",
    text: "To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your credentials and all activity occurring under your account."
  },
  {
    icon: Shield,
    title: "4. API Usage and Fair Use",
    text: "API usage is subject to plan limits, rate limits, and fair use policies. Abuse, reverse engineering, resale without authorization, or misuse may result in suspension or termination."
  },
  {
    icon: CreditCard,
    title: "5. Payments and Billing",
    text: "Paid services are billed via Stripe. Subscription fees, usage-based charges, and credit packages are billed according to the selected plan. All payments are non-refundable unless otherwise required by law."
  },
  {
    icon: FileText,
    title: "6. Intellectual Property",
    text: "All platform content, APIs, branding, documentation, and software are the intellectual property of XPEX Neural. No rights are granted except as expressly stated."
  },
  {
    icon: Lock,
    title: "7. Data and Privacy",
    text: "Use of the platform is also governed by our Privacy Policy. You retain ownership of your data, while granting XPEX Neural limited rights to process it for service delivery."
  },
  {
    icon: Server,
    title: "8. Service Availability",
    text: "We strive for high availability but do not guarantee uninterrupted service. Maintenance, upgrades, or external factors may cause temporary downtime."
  },
  {
    icon: AlertTriangle,
    title: "9. Limitation of Liability",
    text: "XPEX Neural shall not be liable for indirect, incidental, or consequential damages, including loss of data, revenue, or business opportunities."
  },
  {
    icon: Scale,
    title: "10. Termination",
    text: "We reserve the right to suspend or terminate access at any time for violations of these terms or misuse of the platform."
  },
  {
    icon: RefreshCw,
    title: "11. Changes to Terms",
    text: "Terms may be updated periodically. Continued use of the platform constitutes acceptance of the updated terms."
  },
  {
    icon: Globe,
    title: "12. Governing Law",
    text: "These Terms are governed by applicable international commercial laws, without regard to conflict of law principles."
  }
];

const Terms = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service | XPEX Neural</title>
        <meta name="description" content="Terms and conditions governing the use of XPEX Neural APIs, services, and platform." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="py-16 md:py-24 border-b border-border/40">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Legal</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Terms of Service
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              These terms govern access to and use of the XPEX Neural platform, APIs, and services.
            </p>
            <p className="text-sm text-muted-foreground mt-6">
              Last updated: December 2024
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="space-y-8">
              {sections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <article 
                    key={index}
                    className="group p-6 md:p-8 rounded-2xl bg-card border border-border/40 hover:border-border/60 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
                          {section.title}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                          {section.text}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Contact */}
            <div className="mt-16 p-8 rounded-2xl bg-muted/30 border border-border/40 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Questions about these terms?
              </h3>
              <p className="text-muted-foreground mb-6">
              Contact us at{" "}
              <a href="mailto:xpexneural@gmail.com" className="text-primary hover:underline">
                xpexneural@gmail.com
              </a>
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link to="/legal/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <span className="text-border">•</span>
                <Link to="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Terms;
