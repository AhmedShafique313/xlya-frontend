"use client";

import "@/components/landingPage/landing.css";
import { LandingThemeProvider } from "@/components/landingPage/landingTheme";
import Navbar from "@/components/landingPage/Navbar";
import Hero from "@/components/landingPage/Hero";
import StrategySection from "@/components/landingPage/StrategySection";
import GrowthSection from "@/components/landingPage/GrowthSection";
import MarketingSection from "@/components/landingPage/MarketingSection";
import OperationsSection from "@/components/landingPage/OperationsSection";
import Testimonials from "@/components/landingPage/Testimonials";
import FinalCTA from "@/components/landingPage/FinalCTA";
import Footer from "@/components/landingPage/Footer";

export default function Home() {
  return (
    <LandingThemeProvider>
      <Navbar />
      <Hero />
      <StrategySection />
      <GrowthSection />
      <MarketingSection />
      <OperationsSection />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </LandingThemeProvider>
  );
}
