"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, BarChart3, CheckCircle2, FileSpreadsheet, Target, TrendingUp, UploadCloud, UsersRound, X } from "lucide-react";
import { useLandingTheme, type LandingThemeTokens } from "@/components/landingPage/landingTheme";
import {
  analyzeLeadCsv,
  calculateLeadFunnel,
  calculateLeadFunnelFromCsv,
  type LeadCalculatorCsvAnalysis,
  type LeadCalculatorResult,
  type LeadCalculatorScenario,
} from "@/lib/api/leadCalculatorStream";
import styles from "./leadCalculator.module.css";

const MAX_CSV_BYTES = 4 * 1024 * 1024;
const formatNumber = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(value));
const formatMoney = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

type CsvFile = { name: string; text: string; size: number };
type InputMode = "csv" | "manual";

function NumberField({ label, value, onChange, min, max, step = "1", prefix, suffix, t }: {
  label: string; value: string; onChange: (value: string) => void; min: string; max?: string; step?: string; prefix?: string; suffix?: string; t: LandingThemeTokens;
}) {
  return (
    <label className="block min-w-0 text-[11px]" style={{ color: t.fgMid }}>
      <span className="mb-1.5 block truncate">{label}</span>
      <span className="flex h-9 items-center overflow-hidden rounded-lg" style={{ border: `1px solid ${t.border}`, background: t.surface }}>
        {prefix && <span className="pl-2.5 text-xs" style={{ color: t.fgFaint }}>{prefix}</span>}
        <input required type="number" inputMode="decimal" min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.target.value)} className="w-full min-w-0 bg-transparent px-2.5 text-xs outline-none" style={{ color: t.fg, colorScheme: t.isDark ? "dark" : "light" }} />
        {suffix && <span className="pr-2.5 text-xs" style={{ color: t.fgFaint }}>{suffix}</span>}
      </span>
    </label>
  );
}

function MetricCard({ label, value, detail, tag, icon: Icon, t }: {
  label: string; value: string; detail: string; tag: "ACTUAL" | "INPUT" | "ESTIMATE"; icon: typeof UsersRound; t: LandingThemeTokens;
}) {
  return (
    <div className={`min-w-0 rounded-2xl p-4 md:p-5 ${styles.metricGlow}`} style={{ backgroundColor: t.cardDeep, border: `1px solid ${t.border}` }}>
      <div className="flex items-start justify-between gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: t.goldDim, color: t.gold }}><Icon size={18} strokeWidth={1.8} /></span>
        <span className="rounded-md px-1.5 py-1 text-[9px] font-semibold tracking-[0.1em]" style={{ background: t.goldDim, color: t.gold }}>{tag}</span>
      </div>
      <p className="mt-3 text-[11px] font-medium" style={{ color: t.fgMid }}>{label}</p>
      <p className="mt-1 text-[26px] font-semibold tracking-tight md:text-[30px]" style={{ color: t.fg }}>{value}</p>
      <p className="mt-1 truncate text-[10px]" style={{ color: t.fgFaint }}>{detail}</p>
    </div>
  );
}

function ConversionJourney({ result, csvAnalysis, t }: { result: LeadCalculatorResult; csvAnalysis: LeadCalculatorCsvAnalysis | null; t: LandingThemeTokens }) {
  return (
    <section className={`overflow-hidden rounded-2xl p-4 md:p-6 ${styles.flowGlow}`} style={{ backgroundColor: t.cardDeep, border: `1px solid ${t.border}` }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: t.gold }}>Conversion flow</p><h3 className="mt-1 text-base font-semibold">Conversion journey</h3><p className="mt-1 text-[11px]" style={{ color: t.fgMid }}>From starting leads to projected customers, stage by stage.</p></div>
        <span className="rounded-full px-2.5 py-1 text-[10px]" style={{ background: t.surface, color: t.fgMid }}>{csvAnalysis ? "Actual lead base · estimated outcomes" : "Scenario estimates"}</span>
      </div>
      <div className="mt-6 overflow-x-auto pb-2">
        <div className="flex min-w-[760px] items-center">
          {result.stageResults.map((stage, index) => {
            const rate = stage.stageToStageConversionRate;
            return (
              <div key={`${stage.name}-${index}`} className="contents">
                <div className="relative z-10 w-[125px] flex-none rounded-xl px-3 py-3 text-center" style={{ background: t.isDark ? "#211d17" : t.surface, border: `1px solid ${t.gold}`, boxShadow: `0 0 20px ${t.goldGlow}` }}>
                  <p className="truncate text-[10px]" style={{ color: t.fgMid }}>{stage.name}</p>
                  <p className="mt-1 text-[20px] font-semibold tabular-nums" style={{ color: t.fg }}>{formatNumber(stage.expectedVolume)}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.1em]" style={{ color: t.gold }}>{index === 0 && csvAnalysis ? "Actual" : "Estimate"}</p>
                </div>
                {rate !== null && index < result.stageResults.length - 1 && (
                  <div className="relative flex min-w-[34px] flex-1 items-center px-1" aria-label={`${Math.round(rate * 100)}% convert to ${result.stageResults[index + 1].name}`}>
                    <span className={styles.flowLine} />
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold" style={{ color: t.gold }}>{Math.round(rate * 100)}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed" style={{ color: t.fgFaint }}>Stage counts after the first step are forecasts from your conversion assumptions. Values are rounded for display.</p>
    </section>
  );
}

function RevenueOutlook({ result, t }: { result: LeadCalculatorResult; t: LandingThemeTokens }) {
  const months = result.monthlyLeadPlan;
  const volume = months.map((month) => month.expectedLeads ?? month.requiredLeads ?? 0);
  const total = volume.reduce((sum, value) => sum + value, 0) || 1;
  const values = [0, ...volume.map((_, index) => volume.slice(0, index + 1).reduce((sum, value) => sum + result.expectedRevenue * value / total, 0))];
  const ceiling = Math.max(result.expectedRevenue * 1.15, 1);
  const points = values.map((value, index) => ({ x: 43 + index * 543 / Math.max(values.length - 1, 1), y: 174 - value / ceiling * 137 }));
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const area = `${path} L586,174 L43,174 Z`;
  const ticks = [0, Math.floor(months.length / 2), months.length].filter((value, index, all) => all.indexOf(value) === index);
  return (
    <section className="min-w-0 rounded-2xl p-4 md:p-5" style={{ background: t.cardDeep, border: `1px solid ${t.border}` }}>
      <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-semibold">Revenue outlook</h3><p className="mt-1 text-[11px]" style={{ color: t.fgMid }}>Illustrative cumulative forecast across {result.periodMonths} months.</p></div><span className="flex items-center gap-1.5 text-[10px]" style={{ color: t.fgMid }}><span className="h-1.5 w-5 rounded-full" style={{ background: t.gold }} />Forecast</span></div>
      <svg viewBox="0 0 620 205" className="mt-3 h-auto w-full" role="img" aria-label={`Illustrative cumulative revenue forecast ending at ${formatMoney(result.expectedRevenue)}`}>
        <defs><linearGradient id="leadRevenueArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={t.gold} stopOpacity="0.26" /><stop offset="1" stopColor={t.gold} stopOpacity="0.01" /></linearGradient></defs>
        {[37, 105, 174].map((y) => <line key={y} x1="43" x2="586" y1={y} y2={y} stroke={t.border} strokeDasharray="3 5" />)}
        <text x="37" y="42" textAnchor="end" fill={t.fgFaint} fontSize="10">{formatMoney(ceiling)}</text><text x="37" y="109" textAnchor="end" fill={t.fgFaint} fontSize="10">{formatMoney(ceiling / 2)}</text><text x="37" y="178" textAnchor="end" fill={t.fgFaint} fontSize="10">$0</text>
        <path d={area} fill="url(#leadRevenueArea)" /><path d={path} fill="none" stroke={t.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => index === 0 || index === points.length - 1 || points.length <= 7 ? <circle key={index} cx={point.x} cy={point.y} r="3.5" fill={t.gold} /> : null)}
        {ticks.map((tick) => <text key={tick} x={points[tick].x} y="197" textAnchor={tick === 0 ? "start" : tick === months.length ? "end" : "middle"} fill={t.fgMid} fontSize="10">{tick === 0 ? "Start" : `Month ${tick}`}</text>)}
      </svg>
      <p className="text-[10px] leading-relaxed" style={{ color: t.fgFaint }}>Monthly allocation is a planning assumption, not observed revenue timing.</p>
    </section>
  );
}

function CoverageCard({ analysis, result, t }: { analysis: LeadCalculatorCsvAnalysis | null; result: LeadCalculatorResult; t: LandingThemeTokens }) {
  return (
    <section className="rounded-2xl p-4 md:p-5" style={{ background: t.cardDeep, border: `1px solid ${t.border}` }}>
      <h3 className="text-sm font-semibold">{analysis ? "CSV data coverage" : "Scenario summary"}</h3>
      <p className="mt-1 text-[11px]" style={{ color: t.fgMid }}>{analysis ? "Completeness measured in the imported file." : "Assumptions behind the forecast."}</p>
      {analysis ? <div className="mt-5 space-y-5">{(["email", "company", "phone"] as const).map((kind) => (
        <div key={kind} className="grid grid-cols-[68px_minmax(0,1fr)_34px] items-center gap-2 text-[11px]"><span className="capitalize" style={{ color: t.fgMid }}>{kind}</span><div className="h-2.5 overflow-hidden rounded-full" style={{ background: t.surface }}><div className="h-full rounded-full" style={{ width: `${analysis.coverage[kind].percent}%`, background: `linear-gradient(90deg, ${t.gold}88, ${t.gold})` }} /></div><span className="text-right tabular-nums" style={{ color: t.fg }}>{analysis.coverage[kind].percent}%</span></div>
      ))}</div> : <div className="mt-5 space-y-3 text-[11px]" style={{ color: t.fgMid }}><p className="flex justify-between gap-3"><span>Planning period</span><strong style={{ color: t.fg }}>{result.periodMonths} months</strong></p><p className="flex justify-between gap-3"><span>Overall conversion</span><strong style={{ color: t.fg }}>{result.leads > 0 ? (result.expectedCustomers / result.leads * 100).toFixed(1) : "0"}%</strong></p><p className="flex justify-between gap-3"><span>Deal value</span><strong style={{ color: t.fg }}>{formatMoney(result.revenuePerCustomer)}</strong></p></div>}
    </section>
  );
}

export default function LeadCalculatorWorkspace({ accessToken, onBack }: { accessToken: string | null; onBack: () => void }) {
  const { t } = useLandingTheme();
  const fileInput = useRef<HTMLInputElement>(null);
  const analysisRequest = useRef(0);
  const [inputMode, setInputMode] = useState<InputMode>("csv");
  const [manualMode, setManualMode] = useState<"forward" | "reverse">("forward");
  const [csvFile, setCsvFile] = useState<CsvFile | null>(null);
  const [csvAnalysis, setCsvAnalysis] = useState<LeadCalculatorCsvAnalysis | null>(null);
  const [result, setResult] = useState<LeadCalculatorResult | null>(null);
  const [rates, setRates] = useState(["50", "40", "30", "41"]);
  const [startingLeads, setStartingLeads] = useState("1000");
  const [revenueGoal, setRevenueGoal] = useState("50000");
  const [dealValue, setDealValue] = useState("2500");
  const [periodMonths, setPeriodMonths] = useState("6");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState("");

  const panel = { background: t.cardDeep, border: `1px solid ${t.border}` };
  const labels = [inputMode === "csv" ? "Imported" : "Leads", "Qualified", "Engaged", "Opportunity", "Customer"];

  function updateRate(index: number, value: string) {
    setRates((current) => current.map((rate, position) => position === index ? value : rate));
    setResult(null);
  }

  async function selectCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    setResult(null);
    setCsvAnalysis(null);
    setCsvFile(null);
    setIsAnalyzing(false);
    setError("");
    const requestId = ++analysisRequest.current;
    if (!/\.csv$/i.test(file.name) || file.size === 0 || file.size > MAX_CSV_BYTES) {
      setCsvFile(null);
      setError("Choose a nonempty .csv file no larger than 4 MB.");
      return;
    }
    if (!accessToken) { setError("Your session has expired. Please sign in again."); return; }
    const text = await file.text();
    if (requestId !== analysisRequest.current) return;
    setCsvFile({ name: file.name, size: file.size, text });
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeLeadCsv(accessToken, file.name, text);
      if (requestId === analysisRequest.current) setCsvAnalysis(analysis);
    } catch (cause) {
      if (requestId === analysisRequest.current) setError(cause instanceof Error ? cause.message : "The CSV could not be analyzed.");
    } finally {
      if (requestId === analysisRequest.current) setIsAnalyzing(false);
    }
  }

  function removeCsv() {
    analysisRequest.current += 1;
    setCsvFile(null);
    setCsvAnalysis(null);
    setResult(null);
    setError("");
    setIsAnalyzing(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) { setError("Your session has expired. Please sign in again."); return; }
    if (inputMode === "csv" && !csvFile) { setError("Import a Vibe Prospecting CSV first."); return; }
    const scenario: LeadCalculatorScenario = {
      mode: inputMode === "csv" ? "forward" : manualMode,
      ...(inputMode === "manual" && manualMode === "forward" ? { startingLeads: Number(startingLeads) } : {}),
      ...(inputMode === "manual" && manualMode === "reverse" ? { revenueGoal: Number(revenueGoal) } : {}),
      periodMonths: Number(periodMonths),
      revenue: { type: "one_time", amount: Number(dealValue) },
      stages: labels.map((name, index) => index < rates.length ? { name, conversionRate: Number(rates[index]) / 100 } : { name }),
    };
    setError("");
    setIsCalculating(true);
    try {
      if (inputMode === "csv" && csvFile) {
        const estimated = await calculateLeadFunnelFromCsv(accessToken, scenario, csvFile.name, csvFile.text);
        setCsvAnalysis(estimated.csvAnalysis);
        setResult(estimated.result);
      } else {
        setResult(await calculateLeadFunnel(accessToken, scenario));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not calculate this forecast.");
      setResult(null);
    } finally {
      setIsCalculating(false);
    }
  }

  return (
    <div className="p-4 md:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3"><button type="button" onClick={onBack} aria-label="Back to app details" className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg" style={{ border: `1px solid ${t.border}`, color: t.fgMid }}><ArrowLeft size={17} /></button><div><p className="text-[10px]" style={{ color: t.fgFaint }}>Apps / Lead Calculator</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Lead Calculator</h2><p className="mt-1 text-xs" style={{ color: t.fgMid }}>Turn prospect data into a grounded funnel forecast.</p></div></div>
        <div className="flex rounded-xl p-1" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
          {(["csv", "manual"] as const).map((mode) => <button key={mode} type="button" onClick={() => { setInputMode(mode); setResult(null); setError(""); }} className="rounded-lg px-3 py-2 text-[11px] font-semibold" style={{ background: inputMode === mode ? t.goldDim : "transparent", color: inputMode === mode ? t.gold : t.fgMid, border: `1px solid ${inputMode === mode ? t.gold : "transparent"}` }}>{mode === "csv" ? "CSV import" : "Manual"}</button>)}
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="min-w-0 rounded-2xl p-4 md:p-5" style={panel}>
          {inputMode === "csv" ? <>
            <div className="flex items-start gap-3"><span className="grid h-10 w-10 flex-none place-items-center rounded-xl" style={{ background: t.goldDim, color: t.gold }}><UploadCloud size={22} /></span><div><h3 className="text-sm font-semibold">Import Vibe Prospecting CSV</h3><p className="mt-1 text-[11px] leading-relaxed" style={{ color: t.fgMid }}>Use the actual exported lead count as the starting point.</p></div></div>
            <input ref={fileInput} type="file" accept=".csv,text/csv" onChange={selectCsv} className="sr-only" aria-label="Choose CSV file" />
            {csvFile ? <div className="mt-5 flex items-center gap-3 rounded-xl p-3" style={{ background: t.surface, border: `1px solid ${t.border}` }}><FileSpreadsheet size={19} style={{ color: t.gold }} className="flex-none" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{csvFile.name}</p><p className="mt-0.5 text-[10px]" style={{ color: t.fgFaint }}>{(csvFile.size / 1024).toFixed(1)} KB</p></div><button type="button" onClick={removeCsv} aria-label="Remove CSV" style={{ color: t.fgMid }}><X size={17} /></button></div> : <button type="button" onClick={() => fileInput.current?.click()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-5 text-xs font-medium transition-colors hover:brightness-125" style={{ color: t.gold, borderColor: t.gold, background: t.goldDim }}><UploadCloud size={17} />Choose CSV file · up to 4 MB</button>}
            {csvFile && <button type="button" onClick={() => fileInput.current?.click()} className="mt-2 text-[10px] underline underline-offset-2" style={{ color: t.fgMid }}>Choose another file</button>}
            {isAnalyzing ? <p className="mt-3 text-[11px]" style={{ color: t.gold }}>Checking leads and duplicates…</p> : csvAnalysis && <p className="mt-3 flex items-center gap-1.5 text-[11px]" style={{ color: t.gold }}><CheckCircle2 size={14} />{formatNumber(csvAnalysis.uniqueLeads)} valid leads · {formatNumber(csvAnalysis.duplicatesRemoved)} duplicates removed</p>}
          </> : <>
            <div className="flex items-start gap-3"><span className="grid h-10 w-10 flex-none place-items-center rounded-xl" style={{ background: t.goldDim, color: t.gold }}><BarChart3 size={21} /></span><div><h3 className="text-sm font-semibold">Manual planning</h3><p className="mt-1 text-[11px]" style={{ color: t.fgMid }}>Explore a scenario without importing a file.</p></div></div>
            <div className="mt-5 flex gap-2">{(["forward", "reverse"] as const).map((mode) => <button key={mode} type="button" onClick={() => { setManualMode(mode); setResult(null); }} className="flex-1 rounded-lg px-2 py-2 text-[11px]" style={{ background: manualMode === mode ? t.goldDim : t.surface, color: manualMode === mode ? t.gold : t.fgMid, border: `1px solid ${manualMode === mode ? t.gold : t.border}` }}>{mode === "forward" ? "I have leads" : "I have a revenue goal"}</button>)}</div>
            <div className="mt-4"><NumberField label={manualMode === "forward" ? "Starting leads" : "Revenue goal"} value={manualMode === "forward" ? startingLeads : revenueGoal} onChange={manualMode === "forward" ? setStartingLeads : setRevenueGoal} min="1" prefix={manualMode === "reverse" ? "$" : undefined} t={t} /></div>
          </>}
        </div>

        <div className="min-w-0 rounded-2xl p-4 md:p-5" style={panel}>
          <h3 className="text-sm font-semibold">Conversion assumptions</h3><p className="mt-1 text-[11px]" style={{ color: t.fgMid }}>Adjust the rates and deal size to model your forecast.</p>
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3 xl:grid-cols-3">
            {rates.map((rate, index) => <NumberField key={labels[index]} label={`${labels[index]} → ${labels[index + 1]}`} value={rate} onChange={(value) => updateRate(index, value)} min="0" max="100" step="0.1" suffix="%" t={t} />)}
            <NumberField label="Average deal size" value={dealValue} onChange={(value) => { setDealValue(value); setResult(null); }} min="1" prefix="$" t={t} />
            <NumberField label="Planning months" value={periodMonths} onChange={(value) => { setPeriodMonths(value); setResult(null); }} min="1" max="120" t={t} />
          </div>
        </div>
        <div className="xl:col-span-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] leading-relaxed" style={{ color: t.fgFaint }}>Imported lead counts are actual. Downstream stages and revenue are estimates based on your rates.</p>
          <button type="submit" disabled={isCalculating || isAnalyzing} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold disabled:opacity-50" style={{ background: t.gold, color: t.isDark ? "#111" : "#fff" }}>{isCalculating ? "Calculating…" : "Calculate forecast"}{!isCalculating && <ArrowRight size={15} />}</button>
        </div>
      </form>

      {error && <p role="alert" className="mt-4 rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(224,128,107,.12)", color: "#e0806b" }}>{error}</p>}

      {result ? <div className="mt-5 space-y-4" aria-live="polite">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label={csvAnalysis && inputMode === "csv" ? "Imported leads" : result.mode === "reverse" ? "Required leads" : "Starting leads"} value={formatNumber(result.leads)} detail={csvAnalysis && inputMode === "csv" ? "Unique rows from your CSV" : "Scenario starting volume"} tag={csvAnalysis && inputMode === "csv" ? "ACTUAL" : result.mode === "reverse" ? "ESTIMATE" : "INPUT"} icon={UsersRound} t={t} />
          <MetricCard label="Qualified" value={`≈${formatNumber(result.stageResults[1]?.expectedVolume ?? 0)}`} detail="Based on your first conversion rate" tag="ESTIMATE" icon={Target} t={t} />
          <MetricCard label="Customers" value={`≈${formatNumber(result.expectedCustomers)}`} detail="Projected from the full funnel" tag="ESTIMATE" icon={CheckCircle2} t={t} />
          <MetricCard label="Forecast revenue" value={formatMoney(result.expectedRevenue)} detail={`At ${formatMoney(result.revenuePerCustomer)} per customer`} tag="ESTIMATE" icon={TrendingUp} t={t} />
        </div>
        <ConversionJourney result={result} csvAnalysis={inputMode === "csv" ? csvAnalysis : null} t={t} />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.8fr)]"><RevenueOutlook result={result} t={t} /><CoverageCard analysis={inputMode === "csv" ? csvAnalysis : null} result={result} t={t} /></div>
      </div> : <div className="mt-5 flex min-h-[210px] flex-col items-center justify-center rounded-2xl px-5 text-center" style={{ background: t.cardDeep, border: `1px dashed ${t.border}` }}><span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: t.goldDim, color: t.gold }}><BarChart3 size={23} /></span><p className="mt-4 text-sm font-medium">Your forecast starts here</p><p className="mt-1 max-w-sm text-xs leading-relaxed" style={{ color: t.fgMid }}>Import a Vibe Prospecting CSV or enter a manual scenario, then calculate to reveal the conversion journey.</p></div>}
    </div>
  );
}
