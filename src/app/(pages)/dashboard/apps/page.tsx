"use client";

import { useState } from "react";
import { Archivo } from "next/font/google";
import { useAppSelector } from "@/redux/hooks";
import { useLandingTheme } from "@/components/landingPage/landingTheme";
import {
  calculateLeadFunnel,
  LeadCalculatorResult,
  LeadCalculatorScenario,
} from "@/lib/api/leadCalculatorStream";

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

const formatNumber = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
const formatMoney = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

function FunnelGraphic({ result, t }: { result: LeadCalculatorResult; t: ReturnType<typeof useLandingTheme>["t"] }) {
  const maxVolume = Math.max(result.leads, 1);
  const stageGap = 76;
  const height = Math.max(190, result.stageResults.length * stageGap + 28);
  const widthAt = (volume: number) => 170 + 430 * Math.sqrt(Math.max(0, volume) / maxVolume);
  return (
    <svg viewBox={`0 0 760 ${height}`} role="img" aria-label="Funnel chart showing expected volume at each stage" className="h-auto w-full">
      <defs><linearGradient id="funnelGold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={t.gold} stopOpacity="0.58" /><stop offset="0.5" stopColor={t.gold} stopOpacity="0.94" /><stop offset="1" stopColor={t.gold} stopOpacity="0.58" /></linearGradient></defs>
      {result.stageResults.map((stage, index) => {
        const next = result.stageResults[index + 1];
        const topWidth = widthAt(stage.expectedVolume);
        const bottomWidth = next ? widthAt(next.expectedVolume) : Math.max(170, topWidth - 12);
        const y = 12 + index * stageGap;
        const center = 360;
        const path = `M ${center - topWidth / 2} ${y} L ${center + topWidth / 2} ${y} L ${center + bottomWidth / 2} ${y + 57} L ${center - bottomWidth / 2} ${y + 57} Z`;
        return <g key={stage.name}><path d={path} fill="url(#funnelGold)" stroke={t.gold} strokeOpacity="0.7"><title>{`${stage.name}: ${formatNumber(stage.expectedVolume)} expected`}</title></path><text x={center} y={y + 24} textAnchor="middle" fill={t.isDark ? "#15130e" : "#fff"} fontSize="13" fontWeight="700">{stage.name}</text><text x={center} y={y + 43} textAnchor="middle" fill={t.isDark ? "#211d14" : "#fff"} fontSize="12">{formatNumber(stage.expectedVolume)} expected</text>{next && stage.stageToStageConversionRate !== null && <text x="750" y={y + 38} textAnchor="end" fill={t.fgMid} fontSize="11">{Math.round(stage.stageToStageConversionRate * 100)}% convert</text>}</g>;
      })}
      <text x="360" y={height - 1} textAnchor="middle" fill={t.fgFaint} fontSize="10">Expected stage volume · not a guaranteed headcount</text>
    </svg>
  );
}

function MonthlyPlanChart({ result, t }: { result: LeadCalculatorResult; t: ReturnType<typeof useLandingTheme>["t"] }) {
  const values = result.monthlyLeadPlan.map((month) => month.requiredLeads ?? month.expectedLeads ?? 0);
  const maximum = Math.max(...values, 1);
  const label = result.mode === "reverse" ? "Required leads" : "Expected leads";
  return <div><div className="mb-5 flex items-center gap-2 text-[11px]" style={{ color: t.fgMid }}><span className="h-2 w-2 rounded-full" style={{ background: t.gold }} />{label} per month</div><div className="flex h-[190px] items-end gap-2 border-b px-1" style={{ borderColor: t.border }}>{result.monthlyLeadPlan.map((month, index) => { const value = values[index]; const barHeight = Math.max(4, (value / maximum) * 145); return <div key={month.period} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] tabular-nums" style={{ color: t.fgMid }}>{formatNumber(value)}</span><div className="w-full max-w-[44px] rounded-t-md transition-all" style={{ height: `${barHeight}px`, background: `linear-gradient(180deg, ${t.gold}, ${t.gold}88)`, boxShadow: `0 0 22px ${t.goldGlow}` }} /><span className="pb-2 text-[10px]" style={{ color: t.fgFaint }}>M{month.period}</span></div>; })}</div>{result.mode === "reverse" ? <p className="mt-4 text-xs leading-5" style={{ color: t.fgMid }}>Plan for about <strong style={{ color: t.fg }}>{formatNumber(result.requiredLeadsPerMonth ?? 0)}</strong> leads each month to support this target.</p> : <p className="mt-4 text-xs leading-5" style={{ color: t.fgMid }}>Lead volume is distributed evenly across your {result.periodMonths}-month planning window.</p>}</div>;
}

export default function AppsPage() {
  const { t } = useLandingTheme();
  const accessToken = useAppSelector((state) => state.auth.tokens.accessToken);
  const [view, setView] = useState<"details" | "calculator">("details");
  const [mode, setMode] = useState<"forward" | "reverse">("forward");
  const [startingLeads, setStartingLeads] = useState("1000");
  const [revenueGoal, setRevenueGoal] = useState("50000");
  const [dealValue, setDealValue] = useState("2500");
  const [conversionRate, setConversionRate] = useState("12");
  const [periodMonths, setPeriodMonths] = useState("3");
  const [result, setResult] = useState<LeadCalculatorResult | null>(null);
  const [error, setError] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);

  const panelStyle: React.CSSProperties = {
    border: `1px solid ${t.border}`,
    background: t.card,
    borderRadius: 20,
  };
  const fieldStyle: React.CSSProperties = {
    width: "100%",
    background: t.surface,
    color: t.fg,
    border: `1px solid ${t.border}`,
    borderRadius: 10,
    padding: "11px 12px",
    outlineColor: t.gold,
  };

  async function submitCalculation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) {
      setError("Your session has expired. Please sign in again.");
      return;
    }
    setIsCalculating(true);
    setError("");
    try {
      const scenario: LeadCalculatorScenario = {
        mode,
        ...(mode === "forward" ? { startingLeads: Number(startingLeads) } : { revenueGoal: Number(revenueGoal) }),
        periodMonths: Number(periodMonths),
        revenue: { type: "one_time", amount: Number(dealValue) },
        stages: [
          { name: "Leads", conversionRate: Number(conversionRate) / 100 },
          { name: "Customers" },
        ],
      };
      setResult(await calculateLeadFunnel(accessToken, scenario));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Calculation failed. Please check your assumptions and try again.");
      setResult(null);
    } finally {
      setIsCalculating(false);
    }
  }

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
              <div className="p-5 md:p-8">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button type="button" aria-label="Back to app details" onClick={() => setView("details")} className="grid h-9 w-9 place-items-center rounded-lg" style={{ border: `1px solid ${t.border}`, color: t.fgMid }}>‹</button>
                    <div><div className="text-xs" style={{ color: t.fgFaint }}>Apps / Lead Calculator</div><h2 className="mt-1 text-xl font-semibold">Funnel planner</h2></div>
                  </div>
                  <span className="rounded-full px-3 py-1.5 text-[11px]" style={{ color: t.fgMid, background: t.surface }}>Manual assumptions</span>
                </div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.78fr)]">
                  <form onSubmit={submitCalculation} className="rounded-2xl p-4 md:p-5" style={{ border: `1px solid ${t.border}`, background: t.cardDeep }}>
                    <h3 className="text-sm font-semibold">Set your assumptions</h3>
                    <p className="mt-1 text-xs" style={{ color: t.fgMid }}>Explore a simple lead-to-customer funnel.</p>
                    <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl p-1" style={{ background: t.surface }}>
                      {(["forward", "reverse"] as const).map((option) => (
                        <button key={option} type="button" onClick={() => { setMode(option); setResult(null); }} className="rounded-lg px-3 py-2.5 text-xs font-medium capitalize" style={{ color: mode === option ? t.fg : t.fgMid, background: mode === option ? t.card : "transparent", boxShadow: mode === option ? `0 1px 4px ${t.border}` : "none" }}>
                          {option === "forward" ? "I have leads" : "I have a revenue goal"}
                        </button>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <label className="text-xs font-medium" style={{ color: t.fgMid }}>
                        {mode === "forward" ? "Starting leads" : "Revenue goal (USD)"}
                        <input required min="1" step="1" type="number" value={mode === "forward" ? startingLeads : revenueGoal} onChange={(e) => mode === "forward" ? setStartingLeads(e.target.value) : setRevenueGoal(e.target.value)} className="mt-2 text-sm" style={fieldStyle} />
                      </label>
                      <label className="text-xs font-medium" style={{ color: t.fgMid }}>
                        Deal value (USD)
                        <input required min="1" step="1" type="number" value={dealValue} onChange={(e) => setDealValue(e.target.value)} className="mt-2 text-sm" style={fieldStyle} />
                      </label>
                      <label className="text-xs font-medium" style={{ color: t.fgMid }}>
                        Lead → customer conversion
                        <div className="relative mt-2"><input required min="0.01" max="100" step="0.1" type="number" value={conversionRate} onChange={(e) => setConversionRate(e.target.value)} className="pr-9 text-sm" style={fieldStyle} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: t.fgFaint }}>%</span></div>
                      </label>
                      <label className="text-xs font-medium" style={{ color: t.fgMid }}>
                        Planning period (months)
                        <input required min="1" max="120" step="1" type="number" value={periodMonths} onChange={(e) => setPeriodMonths(e.target.value)} className="mt-2 text-sm" style={fieldStyle} />
                      </label>
                    </div>
                    {error && <p role="alert" className="mt-4 rounded-lg px-3 py-2.5 text-xs" style={{ background: "rgba(224,128,107,0.12)", color: "#e0806b" }}>{error}</p>}
                    <button type="submit" disabled={isCalculating} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-60" style={{ background: t.gold, color: t.isDark ? "#111" : "#fff" }}>
                      {isCalculating ? "Calculating…" : "Calculate funnel"}{!isCalculating && <ArrowIcon />}
                    </button>
                    <p className="mt-3 text-center text-[10px] leading-5" style={{ color: t.fgFaint }}>Results are estimates from the inputs you provide.</p>
                  </form>

                  <section className="rounded-2xl p-4 md:p-5" style={{ border: `1px solid ${t.border}`, background: t.surface }} aria-live="polite">
                    <div className="flex items-center justify-between">
                      <div><h3 className="text-sm font-semibold">Your funnel</h3><p className="mt-1 text-xs" style={{ color: t.fgMid }}>{result ? `${result.mode === "forward" ? "Forward" : "Reverse"} estimate · ${result.periodMonths}-month plan` : "Your results will appear here"}</p></div>
                      <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: t.goldDim, color: t.gold }}><CalculatorGlyph size={18} /></span>
                    </div>
                    {result ? (
                      <>
                        <div className="mt-5 grid grid-cols-2 gap-2.5">
                          <div className="rounded-xl p-3" style={{ background: t.card }}><div className="text-[10px]" style={{ color: t.fgFaint }}>LEADS</div><div className="mt-1 text-xl font-semibold">{formatNumber(result.leads)}</div><div className="mt-1 text-[10px]" style={{ color: t.fgFaint }}>Across {result.periodMonths} months</div></div>
                          <div className="rounded-xl p-3" style={{ background: t.card }}><div className="text-[10px]" style={{ color: t.fgFaint }}>EXPECTED CUSTOMERS</div><div className="mt-1 text-xl font-semibold">{formatNumber(result.expectedCustomers)}</div><div className="mt-1 text-[10px]" style={{ color: t.fgFaint }}>{result.leads > 0 ? `${(result.expectedCustomers / result.leads * 100).toFixed(1)}% overall conversion` : "No lead volume"}</div></div>
                        </div>
                        <div className="mt-2.5 rounded-xl p-4" style={{ background: t.card, border: `1px solid ${t.border}` }}><div className="text-[10px]" style={{ color: t.fgFaint }}>EXPECTED REVENUE</div><div className="mt-1 text-[28px] font-semibold tracking-tight" style={{ color: t.gold }}>{formatMoney(result.expectedRevenue)}</div><div className="mt-1 text-[11px]" style={{ color: t.fgMid }}>At {formatMoney(result.revenuePerCustomer)} per customer</div></div>
                        <div className="mt-4 rounded-xl px-3 py-3" style={{ background: t.card }}>
                          <div className="flex items-center justify-between text-xs"><span style={{ color: t.fgMid }}>Average deal value</span><strong>{formatMoney(result.revenuePerCustomer)}</strong></div>
                          <div className="mt-2 flex items-center justify-between text-xs"><span style={{ color: t.fgMid }}>Average lead pace</span><strong>{formatNumber(result.leads / result.periodMonths)} / month</strong></div>
                        </div>
                      </>
                    ) : (
                      <div className="mt-6 grid min-h-[300px] place-items-center rounded-xl p-6 text-center" style={{ border: `1px dashed ${t.border}`, background: t.cardDeep }}>
                        <div><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl" style={{ background: t.goldDim, color: t.gold }}><CalculatorGlyph /></div><div className="text-sm font-medium">Ready when you are</div><p className="mt-1 max-w-[220px] text-xs leading-5" style={{ color: t.fgMid }}>Enter your funnel assumptions and calculate an estimate.</p></div>
                      </div>
                    )}
                  </section>
                </div>

                {result && (
                  <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.8fr)]">
                    <div className="rounded-2xl p-4 md:p-6" style={{ border: `1px solid ${t.border}`, background: t.cardDeep }}>
                      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                        <div><div className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: t.gold }}>CONVERSION FLOW</div><h3 className="mt-1 text-base font-semibold">Your funnel, stage by stage</h3><p className="mt-1 text-xs" style={{ color: t.fgMid }}>See where expected volume moves through the journey.</p></div>
                        <div className="rounded-full px-3 py-1.5 text-[10px]" style={{ color: t.fgMid, background: t.surface }}>From {formatNumber(result.leads)} leads to {formatNumber(result.expectedCustomers)} customers</div>
                      </div>
                      <div className="mx-auto max-w-[760px] rounded-xl p-2 md:p-4" style={{ background: t.surface }}><FunnelGraphic result={result} t={t} /></div>
                      <p className="mt-3 text-[10px] leading-5" style={{ color: t.fgFaint }}>Stage counts are expected values calculated from your conversion assumptions. Real outcomes can differ.</p>
                    </div>
                    <div className="rounded-2xl p-4 md:p-6" style={{ border: `1px solid ${t.border}`, background: t.cardDeep }}>
                      <div className="mb-5"><div className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: t.gold }}>PLANNING PACE</div><h3 className="mt-1 text-base font-semibold">Monthly lead plan</h3><p className="mt-1 text-xs" style={{ color: t.fgMid }}>A month-by-month view for this scenario.</p></div>
                      <MonthlyPlanChart result={result} t={t} />
                    </div>
                  </section>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
