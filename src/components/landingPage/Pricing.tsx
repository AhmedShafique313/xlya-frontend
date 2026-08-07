"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";

interface StarSpec {
  top: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
}

function generateStars(count: number): StarSpec[] {
  return Array.from({ length: count }).map(() => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: 1 + Math.random() * 2,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 5,
  }));
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(query.matches);
    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

const plans = [
  {
    id: 1,
    name: "Starter",
    price: "$6",
    period: "/month",
    description: "Individuals trying out Apps and Agents",
    features: [
      "500 credits",
      "Access to all Apps",
      "Access to all Agents",
      "Use credits across any App or Agent",
    ],
    buttonText: "Get Started",
    isPopular: false,
  },
  {
    id: 2,
    name: "Pro",
    price: "$10",
    period: "/month",
    description: "Power users & small teams with regular usage",
    features: [
      "1,000 credits",
      "Access to all Apps",
      "Access to all Agents",
      "Use credits across any App or Agent",
    ],
    buttonText: "Get Started",
    isPopular: true,
  },
  {
    id: 3,
    name: "Business",
    price: "$20",
    period: "/month",
    description: "Agencies & businesses with high-volume needs",
    features: [
      "2,000 credits",
      "Access to all Apps",
      "Access to all Agents",
      "Use credits across any App or Agent",
    ],
    buttonText: "Get Started",
    isPopular: false,
  },
];

const Pricing = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [stars, setStars] = useState<StarSpec[]>([]);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    // Star positions are randomized client-only to avoid an SSR/client hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStars(generateStars(70));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.2,
        rootMargin: "-50px"
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} id="pricing" className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Starfield */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((star, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white animate-star-twinkle"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Background decorative glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 opacity-5 rounded-full blur-3xl" style={{ backgroundColor: 'var(--gold-primary)' }}></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 opacity-5 rounded-full blur-3xl" style={{ backgroundColor: 'var(--gold-secondary)' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div
          className={`text-center mb-12 sm:mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-5"
            style={{
              borderColor: "color-mix(in srgb, var(--gold-primary) 30%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--gold-primary) 8%, transparent)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--gold-primary)" }} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--gold-primary)" }}>
              Pricing
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Pricing – Simple Credits System
          </h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
            One platform. One credit system. Use credits across any App or any Agent.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{
                y: plan.isPopular && isDesktop ? -20 : 0,
                opacity: 1,
              }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 20,
                delay: index * 0.15,
              }}
              className="relative rounded-2xl p-8 flex flex-col backdrop-blur-sm"
              style={
                plan.isPopular
                  ? {
                      backgroundColor: "rgba(255,255,255,0.04)",
                      border: "2px solid var(--gold-primary)",
                      boxShadow: "0 20px 60px -15px color-mix(in srgb, var(--gold-primary) 35%, transparent)",
                    }
                  : {
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }
              }
            >
              {plan.isPopular && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                  <div
                    className="py-1.5 px-4 rounded-full flex items-center gap-1.5"
                    style={{ backgroundColor: "var(--gold-primary)" }}
                  >
                    <Star className="text-black h-3.5 w-3.5 fill-current" />
                    <span className="text-black text-sm font-semibold">Most Popular</span>
                  </div>
                </div>
              )}

              <div className="flex-1 flex flex-col text-center">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="mt-2 text-sm text-gray-400">{plan.description}</p>

                <div className="mt-6 flex items-baseline justify-center gap-x-1">
                  <span className="text-5xl font-bold tracking-tight text-white">{plan.price}</span>
                  <span className="text-sm font-semibold text-gray-400">{plan.period}</span>
                </div>

                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-left">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <div
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                        style={{ backgroundColor: "var(--gold-primary)", opacity: 0.15 }}
                      >
                        <Check className="w-3 h-3 text-[var(--gold-primary)]" />
                      </div>
                      <span className="text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-8">
                  <Link href="#subscribe">
                    <button
                      className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 text-sm hover:scale-105 ${
                        plan.isPopular
                          ? "animate-button-gradient text-white hover:shadow-2xl"
                          : "text-white border hover:bg-white/5"
                      }`}
                      style={
                        plan.isPopular
                          ? undefined
                          : { borderColor: "color-mix(in srgb, var(--gold-primary) 40%, transparent)" }
                      }
                    >
                      {plan.buttonText}
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
