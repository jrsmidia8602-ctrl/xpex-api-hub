import { Helmet } from "react-helmet-async";
import { Calendar, Clock, ArrowRight, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const posts = [
  {
    id: 1,
    title: "Introducing Gold Email Validator: AI-Powered Email Validation",
    excerpt:
      "Learn how our flagship API combines traditional validation with AI risk scoring for unprecedented accuracy.",
    date: "Dec 10, 2024",
    readTime: "5 min read",
    category: "Product",
    featured: true,
  },
  {
    id: 2,
    title: "The Agent Economy: Why APIs Need to Be Agent-Ready",
    excerpt:
      "As AI agents become mainstream, APIs must evolve. Here's how XPEX Neural is preparing for autonomous consumption.",
    date: "Dec 5, 2024",
    readTime: "8 min read",
    category: "Vision",
    featured: false,
  },
  {
    id: 3,
    title: "Building MCP-Compatible APIs for AI Discovery",
    excerpt:
      "A technical deep-dive into implementing Model Context Protocol for seamless AI agent integration.",
    date: "Nov 28, 2024",
    readTime: "12 min read",
    category: "Technical",
    featured: false,
  },
  {
    id: 4,
    title: "Email Validation Best Practices for 2025",
    excerpt:
      "Disposable emails, typosquatting, and AI-generated addresses. How to protect your platform.",
    date: "Nov 20, 2024",
    readTime: "6 min read",
    category: "Guide",
    featured: false,
  },
  {
    id: 5,
    title: "From Zero to Production API in 48 Hours",
    excerpt:
      "How we built, documented, and deployed the Gold Email Validator using modern serverless architecture.",
    date: "Nov 15, 2024",
    readTime: "10 min read",
    category: "Case Study",
    featured: false,
  },
];

const categories = ["All", "Product", "Vision", "Technical", "Guide", "Case Study"];

const Blog = () => {
  const featuredPost = posts.find((p) => p.featured);
  const regularPosts = posts.filter((p) => !p.featured);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Blog - XPEX Neural | API Insights & Updates</title>
        <meta
          name="description"
          content="Insights on API development, the agent economy, and building for the future of autonomous systems."
        />
      </Helmet>

      <Navbar />

      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-cyan-400 to-purple-500 bg-clip-text text-transparent">
            XPEX Neural Blog
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Insights on APIs, the agent economy, and building autonomous systems.
          </p>
        </section>

        {/* Categories */}
        <section className="container mx-auto px-4 mb-10">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={cat === "All" ? "default" : "outline"}
                size="sm"
                className="rounded-full"
              >
                {cat}
              </Button>
            ))}
          </div>
        </section>

        {/* Featured Post */}
        {featuredPost && (
          <section className="container mx-auto px-4 mb-12">
            <Card className="p-8 bg-gradient-to-br from-primary/10 via-card/50 to-purple-500/10 border-primary/30">
              <Badge className="bg-primary/20 text-primary border-primary/30 mb-4">Featured</Badge>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">{featuredPost.title}</h2>
              <p className="text-muted-foreground mb-4">{featuredPost.excerpt}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {featuredPost.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {featuredPost.readTime}
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  {featuredPost.category}
                </span>
              </div>
              <Button>
                Read Article
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          </section>
        )}

        {/* Posts Grid */}
        <section className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <Card
                key={post.id}
                className="p-6 bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all group cursor-pointer"
              >
                <Badge variant="outline" className="mb-4 text-xs">
                  {post.category}
                </Badge>
                <h3 className="font-bold mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Newsletter */}
        <section className="container mx-auto px-4 mt-16">
          <Card className="p-8 bg-card/50 backdrop-blur border-border/50 text-center">
            <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
            <p className="text-muted-foreground mb-6">
              Get the latest on APIs, agent economy trends, and product updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-2 rounded-lg bg-background border border-border/50 focus:border-primary outline-none"
              />
              <Button>Subscribe</Button>
            </div>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
