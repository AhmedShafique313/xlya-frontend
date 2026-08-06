import Hero from "@/components/landingPage/Hero";
import WhyTexalya from "@/components/landingPage/WhyTexalya";
import Pricing from "@/components/landingPage/Pricing";
import Contact from "@/components/landingPage/Contact";
import Footer from "@/components/landingPage/Footer";
import Navbar from "@/components/landingPage/Navbar";
import AnnouncementBanner from "@/components/landingPage/AnnouncementBanner";
import AnimatedXBackground from "@/components/common/AnimatedXBackground";

export default function Home() {
  return (
    <main className="min-h-screen pt-[116px]">

      <AnimatedXBackground/>

      {/* Fixed top announcement ticker */}
      <AnnouncementBanner />

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