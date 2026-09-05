"use client";

import { useLandingTheme } from "./landingTheme";
import { useInView } from "./useInView";
import SectionLabel from "./SectionLabel";

export default function OperationsSection() {
  const { t } = useLandingTheme();
  const { ref, inView } = useInView();
  return (
    <section ref={ref} style={{ background: t.bg, padding: "140px 32px", borderTop: `1px solid ${t.borderSubtle}`, transition: "background 0.4s" }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}>
        <div style={{ textAlign: "center", maxWidth: 700, margin: "0 auto 80px" }}>
          <SectionLabel number="04" label="Command" />
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 54px)", fontWeight: 300, lineHeight: 1.12, letterSpacing: "-0.025em", color: t.fg, margin: "0 0 24px" }}>
            One place.
            <br />
            <em style={{ fontStyle: "italic" }}>Every moving part.</em>
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.8, color: t.fgDim, fontWeight: 300 }}>
            Xlya replaces the sprawl. Strategy documents, CRM workflows, content calendars, and reporting unified into one intelligent layer. Fewer tools. Less context-switching. More signal.
          </p>
        </div>

        <div className="lp-grid-3">
          {[
            { icon: "◈", title: "Strategy documents", desc: "Living briefs that update as your business evolves. Never stale." },
            { icon: "◎", title: "CRM and pipeline", desc: "Deals, contacts, and follow-ups managed with AI precision." },
            { icon: "◐", title: "Content calendar", desc: "A full quarter of content, planned and drafted. Awaiting your review." },
            { icon: "◑", title: "Email automation", desc: "Sequences that convert, personalized at scale without the overhead." },
            { icon: "◒", title: "Growth reporting", desc: "Weekly reports written in plain English. No spreadsheets required." },
            { icon: "◓", title: "Team workspace", desc: "Shared context so everyone operates from the same intelligence." },
          ].map((card, i) => (
            <div key={i} style={{
              background: t.cardDeep, border: `1px solid ${t.borderSubtle}`, borderRadius: 14, padding: "28px 28px 32px",
              transition: "border-color 0.3s, background 0.3s", cursor: "default",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = t.border; (e.currentTarget as HTMLDivElement).style.background = t.card; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = t.borderSubtle; (e.currentTarget as HTMLDivElement).style.background = t.cardDeep; }}>
              <div style={{ fontSize: 18, color: i === 0 ? t.gold : t.fgFaint, marginBottom: 20 }}>{card.icon}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 400, color: t.fg, marginBottom: 12, letterSpacing: "-0.01em" }}>{card.title}</div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: t.fgDim, lineHeight: 1.7, margin: 0, fontWeight: 300 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
