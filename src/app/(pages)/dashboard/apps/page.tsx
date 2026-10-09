"use client";

import { useState } from "react";
import { Archivo } from "next/font/google";
import { useAppSelector } from "@/redux/hooks";
import { useLandingTheme } from "@/components/landingPage/landingTheme";
import LeadCalculatorWorkspace from "@/components/apps/LeadCalculatorWorkspace";

const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

function CalculatorGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="4" y="2.5" width="16" height="19" rx="3" />
      <path d="M8 6.5h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18.5h.01M12 18.5h.01M16 18.5h.01" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

export default function AppsPage() {
  const { t } = useLandingTheme();
  const accessToken = useAppSelector((state) => state.auth.tokens.accessToken);
  const [view, setView] = useState<"details" | "calculator">("details");
  const panelStyle: React.CSSProperties = { border: `1px solid ${t.border}`, background: t.card, borderRadius: 20 };

  return (
    <div className={`${archivo.className} min-h-screen px-4 pb-8 pt-[82px] md:px-8 md:pb-12 md:pt-[96px]`} style={{ color: t.fg }}>
      <div className="mx-auto w-full max-w-[1440px]">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: t.gold }}>
              <span className="h-px w-6" style={{ background: t.gold }} /> XLYA WORKSPACE
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-[36px]">Apps</h1>
            <p className="mt-1.5 text-sm" style={{ color: t.fgMid }}>Focused tools to turn your work into measurable progress.</p>
          </div>
          <div className="rounded-full px-3 py-1.5 text-xs" style={{ color: t.fgMid, border: `1px solid ${t.border}`, background: t.card }}>
            1 app available
          </div>
        </header>

        <div className="grid min-h-[650px] gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="p-4 md:p-5" style={panelStyle}>
            <div className="mb-4 flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: t.fgMid }}>Your apps</h2>
              <span className="text-[11px]" style={{ color: t.fgFaint }}>01</span>
            </div>
            <button
              type="button"
              onClick={() => setView("details")}
              className="group w-full rounded-2xl p-4 text-left transition-all"
              style={{ background: view === "details" ? t.goldDim : t.surface, border: `1px solid ${view === "details" ? t.gold : t.border}` }}
            >
              <div className="mb-4 flex items-start justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ color: t.gold, background: t.goldDim }}><CalculatorGlyph /></span>
                <span className="rounded-full px-2 py-1 text-[10px] font-medium" style={{ color: t.gold, background: t.goldDim }}>PLANNING</span>
              </div>
              <div className="text-sm font-semibold">Lead Calculator</div>
              <p className="mt-1.5 text-xs leading-relaxed" style={{ color: t.fgMid }}>Plan the funnel behind your revenue target.</p>
              <div className="mt-4 flex items-center justify-between text-[11px]" style={{ color: t.fgFaint }}>
                <span>Marketing</span><span>Open details <ArrowIcon /></span>
              </div>
            </button>
            <div className="mt-5 rounded-xl p-3.5 text-xs leading-relaxed" style={{ background: t.surface, color: t.fgMid }}>
              <div className="mb-1 font-medium" style={{ color: t.fg }}>More apps are on the way</div>
              Your available apps will appear here as they are added to Xlya.
            </div>
          </aside>

          <main className="min-w-0 overflow-hidden" style={panelStyle}>
            {view === "details" ? (
              <div className="flex min-h-[650px] flex-col">
                <div className="relative overflow-hidden p-6 md:p-9" style={{ background: `radial-gradient(ellipse at 90% 0%, ${t.goldGlow}, transparent 45%), ${t.cardDeep}` }}>
                  <div className="relative z-10 max-w-[680px]">
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: t.goldDim, color: t.gold }}><CalculatorGlyph size={27} /></div>
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: t.gold }}>XLYA APP · MARKETING PLANNING</div>
                    <h2 className="text-3xl font-semibold tracking-tight md:text-[42px]">Lead Calculator</h2>
                    <p className="mt-4 max-w-[580px] text-sm leading-7 md:text-[15px]" style={{ color: t.fgMid }}>
                      Turn a few clear assumptions into a practical funnel plan. Estimate expected customers from your lead volume, or work backwards from a revenue goal.
                    </p>
                    <button type="button" onClick={() => setView("calculator")} className="mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5" style={{ background: t.gold, color: t.isDark ? "#111" : "#fff" }}>
                      Open calculator <ArrowIcon />
                    </button>
                  </div>
                  <div className="pointer-events-none absolute -right-6 bottom-[-54px] hidden opacity-[0.12] sm:block" style={{ color: t.gold }}><CalculatorGlyph size={270} /></div>
                </div>
                <div className="grid flex-1 gap-px md:grid-cols-3" style={{ background: t.border }}>
                  {[
                    ["Forward planning", "See expected customer and revenue outcomes from your starting leads."],
                    ["Reverse planning", "Estimate the lead volume needed to reach a revenue target."],
                    ["Assumption led", "Adjust conversion, deal value, and planning period to explore scenarios."],
                  ].map(([title, description], index) => (
                    <div key={title} className="p-6 md:p-7" style={{ background: t.card }}>
                      <div className="mb-3 text-[11px] font-semibold" style={{ color: t.gold }}>0{index + 1}</div>
                      <h3 className="text-sm font-semibold">{title}</h3>
                      <p className="mt-2 text-xs leading-6" style={{ color: t.fgMid }}>{description}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t px-6 py-4 text-xs leading-5 md:px-8" style={{ borderColor: t.border, color: t.fgFaint }}>
                  This is a planning model based on your assumptions. Scenarios are calculated for this request and are not saved.
                </div>
              </div>
            ) : (
              <LeadCalculatorWorkspace accessToken={accessToken} onBack={() => setView("details")} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
