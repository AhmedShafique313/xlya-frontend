"use client";

import { useLandingTheme } from "./landingTheme";
import { useInView } from "./useInView";
import SectionLabel from "./SectionLabel";

export default function StrategySection() {
  const { t } = useLandingTheme();
  const { ref, inView } = useInView();
  return (
    <section ref={ref} style={{ background: t.surface, padding: "140px 32px", borderTop: `1px solid ${t.borderSubtle}`, transition: "background 0.4s" }}>
      <div className="lp-grid-2" style={{
        maxWidth: 1200, margin: "0 auto",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}>
        <div>
          <SectionLabel number="01" label="Strategy" />
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 54px)", fontWeight: 300, lineHeight: 1.12, letterSpacing: "-0.025em", color: t.fg, margin: "0 0 28px" }}>
            A co-pilot that
            <br />
            <em style={{ fontStyle: "italic" }}>thinks in quarters,</em>
            <br />
            not just today.
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.8, color: t.fgDim, margin: "0 0 40px", fontWeight: 300 }}>
            Most tools execute tasks. Xlya holds the full picture. It knows where you are, where you want to go, and what stands between. It asks the questions worth asking before you know to ask them.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              "Quarterly and annual goal architecture",
              "Bottleneck identification before they compound",
              "Decision frameworks built around your business model",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.gold, marginTop: 8, flexShrink: 0, display: "inline-block" }} />
                <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: t.fgDim, lineHeight: 1.6, fontWeight: 300 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <div style={{
            background: t.card, border: `1px solid ${t.border}`, borderRadius: 16,
            padding: 32, backdropFilter: "blur(10px)",
            boxShadow: t.isDark ? "0 0 80px rgba(0,0,0,0.6)" : "0 8px 48px rgba(0,0,0,0.08)",
          }}>
            <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: t.fgFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>Q4 Strategy Overview</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: t.gold, letterSpacing: "0.06em" }}>Live</span>
            </div>
            {[
              { label: "Revenue target", value: "$840K", progress: 68 },
              { label: "Pipeline health", value: "Strong", progress: 82 },
              { label: "CAC efficiency", value: "-18%", progress: 74 },
            ].map((row, i) => (
              <div key={i} style={{ marginBottom: i < 2 ? 24 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: t.fgDim, fontWeight: 300 }}>{row.label}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 14, color: t.fg, fontWeight: 400 }}>{row.value}</span>
                </div>
                <div style={{ height: 2, background: t.progressTrack, borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${row.progress}%`, background: i === 0 ? t.gold : t.barInactive, borderRadius: 2 }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 28, padding: "16px", background: t.suggestionBg, borderRadius: 10, border: `1px solid ${t.borderSubtle}` }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: t.fgDim, lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
                <span style={{ color: t.fgMid }}>Xlya suggests:</span> Prioritize the enterprise segment this quarter. Three deals in late-stage represent 42% of your target.
              </p>
            </div>
          </div>
          <div style={{ position: "absolute", inset: -1, borderRadius: 17, background: `radial-gradient(ellipse at 60% 20%, ${t.goldGlow} 0%, transparent 60%)`, pointerEvents: "none" }} />
        </div>
      </div>
    </section>
  );
}
