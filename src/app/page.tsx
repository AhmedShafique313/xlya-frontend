import Hero from "@/components/landingPage/Hero";
import WhyTexalya from "@/components/landingPage/WhyTexalya";
import Pricing from "@/components/landingPage/Pricing";
import Contact from "@/components/landingPage/Contact";
import Footer from "@/components/landingPage/Footer";
import Navbar from "@/components/landingPage/Navbar";
import AnimatedXBackground from "@/components/common/AnimatedXBackground";

export default function Home() {
  return (
    <main className="min-h-screen pt-[80px]">

      <AnimatedXBackground/>

      <Navbar/>

      {/* Hero Section - Fits in one screen */}
      <Hero />

      {/* Why Texalya Section */}
      <WhyTexalya />

      {/* Pricing Section */}
      <Pricing />

      {/* Contact Section */}
      <Contact />

      {/* Footer */}
      <Footer />
    </main>
  );
}