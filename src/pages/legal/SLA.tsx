import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Shield, Zap, HeadphonesIcon, AlertTriangle, RefreshCw } from "lucide-react";

const SLA = () => {
  const sections = [
    {
      icon: Clock,
      title: "1. Service Availability",
      text: "XPEX Neural commits to 99.9% uptime for all API services during each calendar month. Uptime is calculated as total available minutes minus downtime, divided by total minutes in the month."
    },
    {
      icon: Zap,
      title: "2. Performance Standards",
      text: "API response times are targeted at under 200ms for 95% of requests under normal load conditions. Performance may vary based on request complexity, payload size, and network conditions."
    },
    {
      icon: AlertTriangle,
      title: "3. Scheduled Maintenance",
      text: "Scheduled maintenance windows are announced at least 48 hours in advance via email and status page. Maintenance is typically performed during low-traffic periods (UTC 02:00-06:00)."
    },
    {
      icon: Shield,
      title: "4. Incident Response",
      text: "Critical incidents (service outage) are addressed within 15 minutes. High-priority issues are addressed within 1 hour. Medium-priority issues are addressed within 4 hours. Low-priority issues are addressed within 24 hours."
    },
    {
      icon: HeadphonesIcon,
      title: "5. Support Levels",
      text: "Free tier: Community support via documentation. Pro tier: Email support with 24-hour response time. Enterprise tier: Priority support with dedicated account manager and 1-hour response time."
    },
    {
      icon: RefreshCw,
      title: "6. Service Credits",
      text: "If monthly uptime falls below 99.9%, eligible customers may request service credits: 99.0%-99.9% = 10% credit, 95.0%-99.0% = 25% credit, below 95.0% = 50% credit. Credits apply to the following billing cycle."
    },
    {
      icon: AlertTriangle,
      title: "7. Exclusions",
      text: "SLA does not apply to: scheduled maintenance, force majeure events, issues caused by customer actions, third-party service failures, or free tier usage. Beta features are explicitly excluded from SLA guarantees."
    },
    {
      icon: Shield,
      title: "8. Monitoring and Reporting",
      text: "Service status is monitored 24/7 and reported at status.xpex.dev. Historical uptime data and incident reports are available to Enterprise customers upon request."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Service Level Agreement | XPEX Neural</title>
        <meta name="description" content="XPEX Neural SLA - Our commitment to service availability, performance standards, and support levels." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Service Level Agreement
            </h1>
            <p className="text-lg text-muted-foreground">
              Our commitment to reliability, performance, and support for XPEX Neural services.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      {section.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {section.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <Link to="/legal/terms" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <span>•</span>
              <Link to="/legal/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link to="/docs" className="hover:text-primary transition-colors">
                Documentation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SLA;
