"use client";

import { useLandingTheme } from "./landingTheme";
import { useInView } from "./useInView";

export default function Testimonials() {
  const { t } = useLandingTheme();
  const { ref, inView } = useInView();
  const quotes = [
    { text: "The feeling of having a co-pilot that actually knows my business. I stopped dreading Monday mornings.", name: "Sarah Chen", role: "Founder, Meridian Labs" },
    { text: "We replaced four tools with Xlya. But the real shift was strategic clarity. Our team finally moves in one direction.", name: "Marcus Reid", role: "CEO, Northlight Studio" },
    { text: "Xlya drafts better strategy briefs than consultants I have paid thousands for. And it asks better follow-up questions.", name: "Priya Nair", role: "Head of Growth, Velo Commerce" },
  ];

  return (
    <section ref={ref} style={{ background: t.surface, padding: "140px 32px", borderTop: `1px solid ${t.borderSubtle}`, transition: "background 0.4s" }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}>
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: t.fgFaint, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>From Xlya users</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 300, letterSpacing: "-0.025em", color: t.fg, margin: 0 }}>
            What it feels like
            <br />
            <em style={{ fontStyle: "italic" }}>to run with Xlya.</em>
          </h2>
        </div>
        <div className="lp-grid-3">
          {quotes.map((q, i) => (
            <div key={i} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: "36px 32px", position: "relative", overflow: "hidden" }}>
              {i === 1 && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${t.gold}66, transparent)` }} />
              )}
              <p style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 300, fontStyle: "italic", lineHeight: 1.55, color: t.isDark ? "#c8c8c8" : "#2a2a28", margin: "0 0 32px", letterSpacing: "-0.01em" }}>
                &ldquo;{q.text}&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: t.avatarBg(i), border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 14, color: t.fgMid, fontStyle: "italic" }}>{q.name[0]}</span>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: t.fg, fontWeight: 400 }}>{q.name}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: t.fgFaint, fontWeight: 300 }}>{q.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
