import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductPortfolio from "@/components/ProductPortfolio";
import SocialProof from "@/components/SocialProof";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import { PageTransition } from "@/components/PageTransition";

const Index = () => {
  return (
    <PageTransition>
      <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <Navbar />
        <HeroSection />
        <ProductPortfolio />
        <SocialProof />
        <PricingSection />
        <Footer />
      </main>
    </PageTransition>
  );
};

export default Index;
