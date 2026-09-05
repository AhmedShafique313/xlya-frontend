"use client";

import { useState } from "react";
import { useLandingTheme } from "./landingTheme";
import { useInView } from "./useInView";
import SectionLabel from "./SectionLabel";

export default function MarketingSection() {
  const { t } = useLandingTheme();
  const { ref, inView } = useInView();
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["Content", "Email", "Social"];
  const tabContent = [
    { headline: "Blog post: Q4 planning", sub: "Draft ready for review", status: "In review", detail: "Xlya drafted a 1,400-word article on your Q4 framework, optimized for your top three search terms. Awaiting your approval before scheduling." },
    { headline: "Nurture sequence: Trial users", sub: "5-email series", status: "Running", detail: "The 5-email onboarding sequence is live. Open rate: 54%. Xlya recommends adding a case study to email 3 based on click patterns." },
    { headline: "LinkedIn: This week", sub: "4 posts queued", status: "Queued", detail: "Four posts queued for optimal times Tuesday through Friday. Xlya suggests boosting Thursday's post based on your historical engagement data." },
  ];

  const statusColor = (s: string) =>
    s === "Running" ? (t.isDark ? "#5a9a5a" : "#2d6e2d") : s === "In review" ? t.gold : (t.isDark ? "#5a7a9a" : "#4a6a8a");
  const statusBg = (s: string) =>
    s === "Running" ? "rgba(90,154,90,0.1)" : s === "In review" ? t.goldDim : "rgba(90,122,154,0.1)";

  return (
    <section ref={ref} style={{ background: t.surface, padding: "140px 32px", borderTop: `1px solid ${t.borderSubtle}`, transition: "background 0.4s" }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}>
        <div style={{ maxWidth: 640, marginBottom: 80 }}>
          <SectionLabel number="03" label="Marketing" />
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 54px)", fontWeight: 300, lineHeight: 1.12, letterSpacing: "-0.025em", color: t.fg, margin: "0 0 28px" }}>
            Marketing that runs,
            <br />
            while you lead.
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.8, color: t.fgDim, fontWeight: 300 }}>
            Xlya drafts, schedules, and refines your content calendar, email sequences, and social presence. Every piece aligned to your strategy. Nothing published without your sign-off.
          </p>
        </div>

        <div style={{ display: "flex", gap: 2, background: t.bg, borderRadius: 10, padding: 4, width: "fit-content", marginBottom: 32, border: `1px solid ${t.borderSubtle}` }}>
          {tabs.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)} style={{
              fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 400,
              color: activeTab === i ? t.fg : t.fgDim,
              background: activeTab === i ? t.tabActiveBg : "transparent",
              border: activeTab === i ? `1px solid ${t.tabActiveBorder}` : "1px solid transparent",
              borderRadius: 7, padding: "8px 20px", cursor: "pointer",
              transition: "all 0.2s", letterSpacing: "0.02em",
            }}>
              {tab}
            </button>
          ))}
        </div>

        <div className="lp-tab-panel" style={{
          background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 32,
          boxShadow: t.isDark ? "0 0 60px rgba(0,0,0,0.4)" : "0 8px 40px rgba(0,0,0,0.07)",
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 15, color: t.fg, fontWeight: 400, marginBottom: 4 }}>{tabContent[activeTab].headline}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: t.fgDim, fontWeight: 300 }}>{tabContent[activeTab].sub}</div>
              </div>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: statusColor(tabContent[activeTab].status), background: statusBg(tabContent[activeTab].status), padding: "4px 10px", borderRadius: 100 }}>
                {tabContent[activeTab].status}
              </span>
            </div>
            <div style={{ height: 1, background: t.borderSubtle, marginBottom: 24 }} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: t.fgDim, lineHeight: 1.7, margin: 0, fontWeight: 300 }}>{tabContent[activeTab].detail}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {["Draft", "Approve", "Schedule", "Publish", "Report"].map((step, i) => (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, background: i < 2 ? t.surface : "transparent", border: i < 2 ? `1px solid ${t.border}` : "1px solid transparent" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: i === 0 ? t.stepDoneBg : i === 1 ? t.stepActiveBg : "transparent", border: i >= 2 ? `1px solid ${t.stepInactiveBorder}` : "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {i < 1 && <span style={{ fontSize: 10, color: t.fg }}>✓</span>}
                  {i === 1 && <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.gold, display: "inline-block" }} />}
                </div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: i === 0 ? t.fgDim : i === 1 ? t.fg : t.fgFaint, fontWeight: i === 1 ? 400 : 300 }}>{step}</span>
                {i === 1 && <span style={{ marginLeft: "auto", fontFamily: "var(--font-body)", fontSize: 11, color: t.gold, letterSpacing: "0.06em" }}>Awaiting you</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
