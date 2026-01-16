import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FlagshipProduct from "@/components/FlagshipProduct";
import Ecosystem from "@/components/Ecosystem";
import Benefits from "@/components/Benefits";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <FlagshipProduct />
      <Ecosystem />
      <Benefits />
      <Footer />
    </div>
  );
};

export default Index;
