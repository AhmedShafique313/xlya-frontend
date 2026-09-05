"use client";

import { useLandingTheme } from "./landingTheme";
import { useInView } from "./useInView";
import SectionLabel from "./SectionLabel";

export default function GrowthSection() {
  const { t } = useLandingTheme();
  const { ref, inView } = useInView();
  return (
    <section ref={ref} style={{ background: t.bg, padding: "140px 32px", borderTop: `1px solid ${t.borderSubtle}`, transition: "background 0.4s" }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}>
        <div className="lp-grid-2">
          <div style={{ position: "relative" }}>
            <div style={{
              background: t.cardDeep, border: `1px solid ${t.border}`, borderRadius: 16,
              padding: 32, boxShadow: t.isDark ? "0 0 80px rgba(0,0,0,0.5)" : "0 8px 48px rgba(0,0,0,0.07)",
            }}>
              <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: t.fgFaint, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Monthly Revenue</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 300, color: t.fg, letterSpacing: "-0.02em" }}>$127,400</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: t.isDark ? "#4a7a4a" : "#3a6a3a", marginTop: 4 }}>+24% from last month</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, marginBottom: 24 }}>
                {[40, 55, 45, 70, 62, 80, 68, 90, 75, 100, 85, 100].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: "2px 2px 0 0", background: i === 11 ? t.gold : i > 7 ? t.barInactive : t.barFaint }} />
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[{ label: "New customers", v: "34" }, { label: "Churn rate", v: "1.2%" }, { label: "LTV", v: "$4,820" }, { label: "NPS", v: "71" }].map((s) => (
                  <div key={s.label} style={{ padding: "12px 14px", background: t.statBg, borderRadius: 8, border: `1px solid ${t.borderSubtle}` }}>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: t.fgFaint, marginBottom: 4, letterSpacing: "0.06em" }}>{s.label}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 300, color: t.fg }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <SectionLabel number="02" label="Growth" />
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 54px)", fontWeight: 300, lineHeight: 1.12, letterSpacing: "-0.025em", color: t.fg, margin: "0 0 28px" }}>
              Growth you can
              <br />
              see, understand,
              <br />
              <em style={{ fontStyle: "italic", color: t.gold }}>and act on.</em>
            </h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.8, color: t.fgDim, margin: "0 0 40px", fontWeight: 300 }}>
              Xlya pulls revenue, pipeline, and retention into a single coherent view. Not a dashboard you interpret. A co-pilot that surfaces what actually matters and flags what needs your attention first.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                "Real-time revenue and retention tracking",
                "Anomaly detection with plain-English context",
                "Opportunity scoring across your entire pipeline",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.barInactive, marginTop: 8, flexShrink: 0, display: "inline-block" }} />
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: t.fgDim, lineHeight: 1.6, fontWeight: 300 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
