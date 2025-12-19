import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductPortfolio from "@/components/ProductPortfolio";
import SocialProof from "@/components/SocialProof";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <ProductPortfolio />
      <SocialProof />
      <PricingSection />
      <Footer />
    </main>
  );
};

export default Index;
