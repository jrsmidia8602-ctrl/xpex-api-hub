import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import APIsSection from "@/components/APIsSection";
import EmailValidator from "@/components/EmailValidator";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <APIsSection />
      <EmailValidator />
      <PricingSection />
      <Footer />
    </main>
  );
};

export default Index;
