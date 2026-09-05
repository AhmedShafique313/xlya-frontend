"use client";

import Link from "next/link";
import Logo from "@/components/common/Logo";
import { useLandingTheme } from "./landingTheme";
import { useInView } from "./useInView";

export default function FinalCTA() {
  const { t } = useLandingTheme();
  const { ref, inView } = useInView();
  return (
    <section ref={ref} style={{ background: t.bg, padding: "160px 32px", borderTop: `1px solid ${t.borderSubtle}`, position: "relative", overflow: "hidden", transition: "background 0.4s" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(ellipse at center, ${t.goldGlow} 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{
        maxWidth: 720, margin: "0 auto", textAlign: "center", position: "relative",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}>
        <div style={{ display: "inline-flex", marginBottom: 32 }}>
          <Logo size="sm" variant={t.isDark ? "dark" : "light"} />
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px, 5vw, 68px)", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.03em", color: t.fg, margin: "0 0 28px" }}>
          Ready to run
          <br />
          <em style={{ fontStyle: "italic" }}>with something</em>
          <br />
          smarter?
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 17, lineHeight: 1.75, color: t.fgDim, margin: "0 0 52px", fontWeight: 300 }}>
          Join founders and operators already running their business with Xlya. Sign up in under two minutes.
        </p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <Link href="/onboarding" style={{
            fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 500,
            color: t.ctaFg, background: t.ctaBg,
            padding: "16px 44px", borderRadius: 8, textDecoration: "none",
            letterSpacing: "0.01em", transition: "opacity 0.25s, transform 0.25s", display: "inline-block",
          }}>
            Start for free
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
            {["No credit card", "Cancel anytime", "Free plan available"].map((item) => (
              <span key={item} style={{ fontFamily: "var(--font-body)", fontSize: 12, color: t.fgFaint, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: t.fgFaint, display: "inline-block", opacity: 0.5 }} />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
