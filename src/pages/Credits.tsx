import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CreditPackages from "@/components/CreditPackages";

const Credits = () => {
  return (
    <>
      <Helmet>
        <title>Buy Credits | XPEX Neural</title>
        <meta name="description" content="Purchase API credits for XPEX Neural. Pay-as-you-go pricing with no expiration." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20">
          <CreditPackages />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Credits;
