"use client";

import "@/components/landingPage/landing.css";
import { LandingThemeProvider } from "@/components/landingPage/landingTheme";
import Navbar from "@/components/landingPage/Navbar";
import PricingSection from "@/components/landingPage/PricingSection";
import Footer from "@/components/landingPage/Footer";

export default function PricingPage() {
  return (
    <LandingThemeProvider>
      <Navbar />
      <PricingSection />
      <Footer />
    </LandingThemeProvider>
  );
}
