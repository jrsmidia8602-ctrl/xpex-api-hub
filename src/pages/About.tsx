import { Helmet } from "react-helmet-async";
import { Zap, Target, Globe, Users, Code, Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";

const values = [
  {
    icon: Zap,
    title: "Speed First",
    description: "APIs designed for sub-50ms response times. Performance is not optional.",
  },
  {
    icon: Target,
    title: "Developer Focus",
    description: "Built by developers, for developers. Clean docs, SDKs, and examples.",
  },
  {
    icon: Globe,
    title: "Agent Economy Ready",
    description: "APIs that AI agents can discover, understand, and use autonomously.",
  },
];

const team = [
  {
    name: "Junior Sena",
    role: "Founder & AI Architect",
    bio: "AI systems architect specializing in orchestration and multi-agent systems.",
  },
];

const milestones = [
  { year: "2024", event: "XPEX Neural founded" },
  { year: "2024", event: "Gold Email Validator launched" },
  { year: "2025", event: "Agent Marketplace beta" },
  { year: "2025", event: "Enterprise partnerships" },
];

const About = () => {
  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>About - XPEX Neural | Building the Agent Economy</title>
        <meta
          name="description"
          content="Learn about XPEX Neural's mission to build APIs that power the autonomous agent economy. Meet our team and discover our vision."
        />
      </Helmet>

      <Navbar />

      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Building APIs for the Agent Economy
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            XPEX Neural creates production-ready APIs that humans, companies, and AI agents can discover,
            use, and pay for automatically. We believe in a future where APIs are living products
            and automation is the default.
          </p>
        </section>

        {/* Mission */}
        <section className="container mx-auto px-4 mb-20">
          <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/10 via-card/50 to-purple-500/10 border-primary/30 text-center">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/20 mb-6">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              "APIs são produtos vivos. Agentes são clientes. Automação é lucro."
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              We build APIs. Agents work for you. Revenue arrives automatically.
            </p>
          </Card>
        </section>

        {/* Values */}
        <section className="container mx-auto px-4 mb-20">
          <h2 className="text-3xl font-bold text-center mb-10">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value) => (
              <Card
                key={value.title}
                className="p-6 bg-card/50 backdrop-blur border-border/50 text-center"
              >
                <div className="inline-flex items-center justify-center p-3 rounded-lg bg-primary/10 mb-4">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="container mx-auto px-4 mb-20">
          <h2 className="text-3xl font-bold text-center mb-10">Leadership</h2>
          <div className="max-w-md mx-auto">
            {team.map((member) => (
              <Card
                key={member.name}
                className="p-6 bg-card/50 backdrop-blur border-border/50 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-500 mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-10 h-10 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">{member.name}</h3>
                <p className="text-primary text-sm mb-2">{member.role}</p>
                <p className="text-muted-foreground text-sm">{member.bio}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="container mx-auto px-4 mb-20">
          <h2 className="text-3xl font-bold text-center mb-10">Our Journey</h2>
          <div className="max-w-2xl mx-auto">
            <div className="relative border-l-2 border-primary/30 pl-8 space-y-8">
              {milestones.map((milestone, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-10 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                  <div className="text-sm text-primary font-semibold">{milestone.year}</div>
                  <div className="text-muted-foreground">{milestone.event}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="container mx-auto px-4">
          <Card className="p-8 bg-card/50 backdrop-blur border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <Code className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Built With</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {["React", "TypeScript", "FastAPI", "Supabase", "Stripe", "Vercel", "OpenAPI", "MCP", "LangChain"].map(
                (tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm border border-primary/20"
                  >
                    {tech}
                  </span>
                )
              )}
            </div>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
    </PageTransition>
  );
};

export default About;
