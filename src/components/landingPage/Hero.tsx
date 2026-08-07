"use client";

import { useEffect, useState, useRef } from "react";
import {
  Sparkles,
  Cpu,
  TrendingUp,
  Settings,
  Lightbulb,
  Rocket,
  Calendar,
  Users,
} from "lucide-react";

const OFFERINGS = [
  { icon: TrendingUp, name: "Lead Calculator" },
  { icon: Settings, name: "Word File Editor" },
  { icon: Lightbulb, name: "MediMind Agent" },
  { icon: Rocket, name: "SEO/AEO/GEO Agent" },
  { icon: Calendar, name: "Meeting Prep Agent" },
  { icon: Users, name: "Strategy Generator" },
];

const Hero = () => {
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(50);
  const [isVisible, setIsVisible] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  const rotatingLines = [
    "Work Smarter with Apps & Agents",
    "One Platform, Endless Capability.",
    "Your All-in-One AI Workspace"
  ];

  useEffect(() => {
    const handleTyping = () => {
      const currentIndex = loopNum % rotatingLines.length;
      const fullText = rotatingLines[currentIndex];

      if (!isDeleting) {
        setDisplayedText(fullText.substring(0, displayedText.length + 1));
        setTypingSpeed(50);

        if (displayedText === fullText) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setDisplayedText(fullText.substring(0, displayedText.length - 1));
        setTypingSpeed(30);

        if (displayedText === "") {
          setIsDeleting(false);
          setLoopNum(loopNum + 1);
          setTypingSpeed(500);
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, loopNum, typingSpeed]);

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

  const goldenPhrases = ["Apps & Agents", "Capability", "AI Workspace"];

  const renderText = () => {
    for (const phrase of goldenPhrases) {
      const idx = displayedText.indexOf(phrase);
      if (idx !== -1) {
        return (
          <>
            <span className="text-white">{displayedText.slice(0, idx)}</span>
            <span className="text-[var(--gold-primary)]">{displayedText.slice(idx, idx + phrase.length)}</span>
            <span className="text-white">{displayedText.slice(idx + phrase.length)}</span>
          </>
        );
      }
      // partial match at the end (still typing the phrase)
      for (let len = phrase.length - 1; len > 0; len--) {
        if (displayedText.endsWith(phrase.slice(0, len))) {
          const before = displayedText.slice(0, displayedText.length - len);
          const partial = displayedText.slice(displayedText.length - len);
          return (
            <>
              <span className="text-white">{before}</span>
              <span className="text-[var(--gold-primary)]">{partial}</span>
            </>
          );
        }
      }
    }
    return <span className="text-white">{displayedText}</span>;
  };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-20 pb-12 sm:pt-24 sm:pb-16"
    >
      {/* Background decorative glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 left-1/4 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--gold-primary)", opacity: 0.05 }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--gold-secondary)", opacity: 0.05 }}
        />
      </div>

      <div
        className={`relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-start transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* --- LEFT COLUMN --- */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-5 sm:space-y-6">
          {/* Badge */}
          <div
            className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 backdrop-blur-md"
            style={{
              borderColor: "color-mix(in srgb, var(--gold-primary) 30%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--gold-primary) 8%, transparent)",
            }}
          >
            <Sparkles className="w-3 h-3 text-[var(--gold-primary)]" />
            <span className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--gold-primary)]">
              Apps & Agents in One Platform
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] min-h-[2.2em] sm:min-h-[2em]">
            {renderText()}
            <span className="animate-pulse text-[var(--gold-primary)]">|</span>
          </h1>

          {/* Tagline */}
          <p className="text-base sm:text-lg md:text-xl text-[#918C94]">
            Xlya – Smart Apps & Multi-Purpose Agents
          </p>

          {/* Description */}
          <p className="max-w-xl text-xs sm:text-sm md:text-base text-[#918C94] leading-relaxed">
            Xlya delivers two powerful things in one platform: productivity Apps for daily tasks and intelligent Agents for complex workflows. From lead calculation to medical diagnosis, SEO analysis to automated meeting scheduling – get more done with specialized AI.
          </p>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="lg:col-span-5 space-y-5 lg:mt-3">
          {/* Capabilities Card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl">
            <div
              className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full blur-3xl pointer-events-none"
              style={{ backgroundColor: "var(--gold-primary)", opacity: 0.08 }}
            />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl ring-1"
                  style={{
                    background: "linear-gradient(135deg, var(--gold-primary), color-mix(in srgb, var(--gold-primary) 60%, #000))",
                    borderColor: "color-mix(in srgb, var(--gold-primary) 40%, transparent)",
                  }}
                >
                  <Cpu className="h-5 w-5 text-white" />
                </div>
                <div className="text-lg font-semibold text-white">Core Capabilities: Apps & Agents</div>
              </div>

              <div className="h-px w-full bg-white/10 mb-5" />

              {/* Offerings list */}
              <div className="space-y-2.5 mb-5">
                {OFFERINGS.slice(0, 4).map((item) => (
                  <div key={item.name} className="flex items-center gap-2.5">
                    <div
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: "color-mix(in srgb, var(--gold-primary) 12%, transparent)" }}
                    >
                      <item.icon className="h-3.5 w-3.5 text-[var(--gold-primary)]" />
                    </div>
                    <span className="text-xs text-zinc-300">{item.name}</span>
                  </div>
                ))}
              </div>

              <div className="h-px w-full bg-white/10 mb-5" />

              {/* Tag Pills */}
              <div className="flex flex-wrap gap-2">
                <div
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-medium tracking-wide text-zinc-300"
                  style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)" }}
                >
                  <Cpu className="w-2.5 h-2.5 text-[var(--gold-primary)]" />
                  AI-POWERED
                </div>
                <div
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-medium tracking-wide text-zinc-300"
                  style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)" }}
                >
                  <Sparkles className="w-2.5 h-2.5 text-[var(--gold-primary)]" />
                  MULTI-AGENT
                </div>
              </div>
            </div>
          </div>

          {/* Marquee Card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 py-6 backdrop-blur-xl">
            <h3 className="mb-5 px-6 text-xs font-medium text-zinc-400">Apps & Agents on Xlya</h3>

            <div
              className="relative flex overflow-hidden"
              style={{
                maskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
              }}
            >
              <div className="animate-marquee flex gap-8 whitespace-nowrap px-4">
                {[...OFFERINGS, ...OFFERINGS, ...OFFERINGS].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 opacity-60 transition-all hover:opacity-100 cursor-default"
                  >
                    <item.icon className="h-4 w-4 text-[var(--gold-primary)]" />
                    <span className="text-xs font-medium text-white tracking-tight">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
