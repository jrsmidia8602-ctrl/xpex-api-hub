import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Database, Eye, Lock, Share2, Cookie, Clock, UserCheck, Globe, Mail, RefreshCw } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Footer from "@/components/Footer";

const sections = [
  {
    icon: Database,
    title: "1. Information We Collect",
    text: "We collect information you provide directly, including account details (email, name), payment information processed via Stripe, API usage data, and communications with our support team."
  },
  {
    icon: Eye,
    title: "2. How We Use Your Information",
    text: "We use collected information to provide and improve our services, process transactions, send service communications, monitor API usage, detect fraud, and comply with legal obligations."
  },
  {
    icon: Share2,
    title: "3. Information Sharing",
    text: "We do not sell your personal data. We may share information with service providers (Stripe, analytics), when required by law, or to protect rights and safety. Third parties are bound by confidentiality."
  },
  {
    icon: Lock,
    title: "4. Data Security",
    text: "We implement industry-standard security measures including encryption, secure data centers, and access controls. However, no method of transmission over the internet is 100% secure."
  },
  {
    icon: Clock,
    title: "5. Data Retention",
    text: "We retain your data for as long as your account is active or as needed to provide services. Usage logs are retained for billing and compliance purposes. You may request data deletion at any time."
  },
  {
    icon: Cookie,
    title: "6. Cookies and Tracking",
    text: "We use cookies and similar technologies to maintain sessions, remember preferences, and analyze usage. You can control cookie settings through your browser, though some features may be affected."
  },
  {
    icon: UserCheck,
    title: "7. Your Rights",
    text: "You have the right to access, correct, or delete your personal data. You may also request data portability or object to certain processing. Contact us to exercise these rights."
  },
  {
    icon: Globe,
    title: "8. International Transfers",
    text: "Your data may be processed in countries other than your own. We ensure appropriate safeguards are in place for international data transfers in compliance with applicable laws."
  },
  {
    icon: Shield,
    title: "9. Children's Privacy",
    text: "Our services are not directed to children under 16. We do not knowingly collect personal information from children. If we learn we have collected such data, we will delete it promptly."
  },
  {
    icon: Mail,
    title: "10. Communications",
    text: "We may send service-related emails (billing, security alerts) which cannot be opted out. Marketing communications can be unsubscribed at any time via the link in each email."
  },
  {
    icon: RefreshCw,
    title: "11. Policy Updates",
    text: "We may update this policy periodically. Material changes will be notified via email or platform notice. Continued use after changes constitutes acceptance of the updated policy."
  },
  {
    icon: Mail,
    title: "12. Contact Us",
    text: "For privacy-related questions or to exercise your rights, contact us at privacy@xpex.io. We will respond to requests within 30 days as required by applicable law."
  }
];

const Privacy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | XPEX Neural</title>
        <meta name="description" content="Learn how XPEX Neural collects, uses, and protects your personal information when using our APIs and services." />
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
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Legal</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Privacy Policy
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
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
                Questions about your privacy?
              </h3>
              <p className="text-muted-foreground mb-6">
                Contact our privacy team at{" "}
                <a href="mailto:privacy@xpex.io" className="text-primary hover:underline">
                  privacy@xpex.io
                </a>
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link to="/legal/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
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

export default Privacy;
