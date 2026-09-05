"use client";

import Link from "next/link";
import { useLandingTheme } from "./landingTheme";
import { useInView } from "./useInView";
import SectionLabel from "./SectionLabel";

const plans = [
  {
    name: "Starter",
    price: "$6",
    period: "/month",
    description: "Individuals trying out Apps and Agents",
    features: ["500 credits", "Access to all Apps", "Access to all Agents", "Use credits across any App or Agent"],
    isPopular: false,
  },
  {
    name: "Pro",
    price: "$10",
    period: "/month",
    description: "Power users & small teams with regular usage",
    features: ["1,000 credits", "Access to all Apps", "Access to all Agents", "Use credits across any App or Agent"],
    isPopular: true,
  },
  {
    name: "Business",
    price: "$20",
    period: "/month",
    description: "Agencies & businesses with high-volume needs",
    features: ["2,000 credits", "Access to all Apps", "Access to all Agents", "Use credits across any App or Agent"],
    isPopular: false,
  },
];

export default function PricingSection() {
  const { t } = useLandingTheme();
  const { ref, inView } = useInView();
  return (
    <section ref={ref} style={{ background: t.bg, padding: "160px 32px 140px", transition: "background 0.4s" }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 72px" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <SectionLabel number="—" label="Pricing" />
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4.5vw, 58px)", fontWeight: 300, lineHeight: 1.12, letterSpacing: "-0.025em", color: t.fg, margin: "0 0 24px" }}>
            One platform,
            <br />
            <em style={{ fontStyle: "italic" }}>one credit system.</em>
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.8, color: t.fgDim, fontWeight: 300 }}>
            Use credits across any App or any Agent. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        <div className="lp-grid-3" style={{ alignItems: "start" }}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                position: "relative",
                background: plan.isPopular ? t.card : t.cardDeep,
                border: plan.isPopular ? `2px solid ${t.gold}` : `1px solid ${t.borderSubtle}`,
                borderRadius: 16,
                padding: "36px 28px 28px",
                boxShadow: plan.isPopular
                  ? (t.isDark ? "0 20px 60px -15px rgba(190,165,111,0.3)" : "0 20px 60px -15px rgba(138,104,48,0.25)")
                  : "none",
              }}
            >
              {plan.isPopular && (
                <span style={{
                  position: "absolute", top: 0, left: "50%", transform: "translate(-50%, -50%)",
                  fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase",
                  color: t.ctaFg, background: t.gold, padding: "5px 14px", borderRadius: 100,
                }}>
                  Most popular
                </span>
              )}
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 400, color: t.fg, textAlign: "center", margin: "0 0 8px" }}>{plan.name}</h3>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: t.fgDim, textAlign: "center", margin: "0 0 24px", fontWeight: 300 }}>{plan.description}</p>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginBottom: 28 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 300, color: t.fg, letterSpacing: "-0.02em" }}>{plan.price}</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: t.fgFaint }}>{plan.period}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.gold, marginTop: 8, flexShrink: 0, display: "inline-block" }} />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: t.fgDim, lineHeight: 1.5, fontWeight: 300 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/onboarding" style={{
                display: "block", textAlign: "center", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500,
                color: plan.isPopular ? t.ctaFg : t.fg,
                background: plan.isPopular ? t.ctaBg : "transparent",
                border: plan.isPopular ? "none" : `1px solid ${t.border}`,
                padding: "12px 20px", borderRadius: 8, textDecoration: "none",
              }}>
                Get started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
