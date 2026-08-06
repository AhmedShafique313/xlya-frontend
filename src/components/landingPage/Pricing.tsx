"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

const Pricing = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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
        "Use credits across any App or Agent"
      ],
      buttonText: "Get Started",
      buttonStyle: "animate-button-gradient bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-white hover:shadow-2xl hover:scale-105"
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
        "Use credits across any App or Agent"
      ],
      buttonText: "Get Started",
      buttonStyle: "animate-button-gradient bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-white hover:shadow-2xl hover:scale-105"
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
        "Use credits across any App or Agent"
      ],
      buttonText: "Get Started",
      buttonStyle: "animate-button-gradient bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-white hover:shadow-2xl hover:scale-105"
    },
  ];

  return (
    <section ref={sectionRef} id="pricing" className="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 opacity-5 rounded-full blur-3xl" style={{ backgroundColor: 'var(--gold-primary)' }}></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 opacity-5 rounded-full blur-3xl" style={{ backgroundColor: 'var(--gold-secondary)' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div
          className={`text-center mb-8 sm:mb-12 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
            Pricing – Simple Credits System
          </h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
            One platform. One credit system. Use credits across any App or any Agent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 flex flex-col transition-all duration-700 hover:scale-105 hover:-translate-y-1.5 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{
                transitionDelay: isVisible ? `${index * 150}ms` : '0ms',
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)"
              }}
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-1">
                  {plan.name}
                </h3>
                <p className="text-gray-400 text-sm">
                  {plan.description}
                </p>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-400 ml-2 text-base">
                    {plan.period}
                  </span>
                </div>
              </div>

              <Link href="#subscribe" className="mb-6">
                <button 
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 text-sm ${plan.buttonStyle}`}
                >
                  {plan.buttonText}
                </button>
              </Link>

              <div className="space-y-3 flex-grow">
                <p className="text-xs font-semibold text-gray-300 mb-3">
                  What's included:
                </p>
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5" style={{ backgroundColor: 'var(--gold-primary)', opacity: 0.15 }}>
                      <Check className="w-3 h-3 text-[var(--gold-primary)]" />
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {feature}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Pricing;