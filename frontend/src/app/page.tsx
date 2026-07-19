
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import QRGenerator from "@/components/QRGenerator";
import FeaturesSection from "@/components/FeaturesSection";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <div id="features">
        <FeaturesSection />
      </div>
      <QRGenerator />
      <PricingSection />
      <Footer />
    </div>
  );
}
