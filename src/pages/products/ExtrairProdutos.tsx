import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Database, ShoppingCart, TrendingUp, Package, ArrowRight, Search, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const ExtrairProdutos = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleExtract = async () => {
    if (!url) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setResult({
      title: 'iPhone 15 Pro Max 256GB',
      price: 'R$ 8.499,00',
      original_price: 'R$ 9.999,00',
      discount: '15%',
      seller: 'Apple Store Oficial',
      rating: 4.9,
      reviews: 2847,
      availability: 'Em estoque',
      shipping: 'Frete grátis',
      images: 3,
      marketplace: 'Mercado Livre',
    });
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>ExtrairProdutos - Product Data Scraper | XPEX AI</title>
        <meta
          name="description"
          content="Scrape product data from major marketplaces automatically. Price tracking and structured data extraction."
        />
      </Helmet>

      <main className="min-h-screen bg-background text-foreground">
        <Navbar />

        {/* Hero */}
        <section className="pt-32 pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 text-primary border-primary/30">
                Data Extraction
              </Badge>

              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-foreground">Extrair</span>
                <span className="text-gradient">Produtos</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Extraia dados de produtos de marketplaces automaticamente. Monitoramento de preços e dados estruturados.
              </p>

              {/* Demo Extractor */}
              <Card className="p-8 bg-card/50 backdrop-blur border-border/50 max-w-2xl mx-auto">
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="Cole a URL do produto (Mercado Livre, Amazon, etc.)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleExtract} disabled={loading || !url}>
                    {loading ? (
                      <>
                        <Database className="w-4 h-4 mr-2 animate-spin" /> Extraindo...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" /> Extrair
                      </>
                    )}
                  </Button>
                </div>

                {result && (
                  <div className="text-left space-y-4 p-4 rounded-lg bg-background/50">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-primary border-primary/30">
                        {result.marketplace}
                      </Badge>
                      <Badge variant="secondary" className="text-green-500">
                        {result.availability}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-lg">{result.title}</h3>

                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-primary">{result.price}</span>
                      <span className="text-muted-foreground line-through">{result.original_price}</span>
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                        -{result.discount}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/50">
                      <div className="text-center">
                        <div className="text-sm font-medium">{result.seller}</div>
                        <div className="text-xs text-muted-foreground">Vendedor</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">⭐ {result.rating}</div>
                        <div className="text-xs text-muted-foreground">{result.reviews} avaliações</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">{result.shipping}</div>
                        <div className="text-xs text-muted-foreground">Entrega</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">{result.images} imagens</div>
                        <div className="text-xs text-muted-foreground">Mídia</div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-secondary/20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: ShoppingCart,
                  title: 'Multi-marketplace',
                  description: 'Suporte a Mercado Livre, Amazon, Shopee e mais.',
                },
                {
                  icon: TrendingUp,
                  title: 'Price Tracking',
                  description: 'Histórico de preços e alertas de variação.',
                },
                {
                  icon: Package,
                  title: 'Structured Data',
                  description: 'Dados estruturados em JSON prontos para uso.',
                },
              ].map((feature) => (
                <Card
                  key={feature.title}
                  className="p-6 bg-card/50 backdrop-blur border-border/50"
                >
                  <feature.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Preço Simples</h2>
            <p className="text-muted-foreground mb-8">$0.005 por extração</p>
            <Button size="lg" asChild>
              <Link to="/auth">
                Começar Agora <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
};

export default ExtrairProdutos;
