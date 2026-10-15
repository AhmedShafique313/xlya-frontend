"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Calculator,
  Clock3,
  ExternalLink,
  FileText,
  Globe,
  ScanSearch,
  Users,
} from "lucide-react";
import EmailVerificationGate from "@/components/dashboard/EmailVerificationGate";
import { useLandingTheme, type LandingThemeTokens } from "@/components/landingPage/landingTheme";
import { useAppSelector } from "@/redux/hooks";

type DashboardTab = "overview" | "insights" | "quick-use";

const quickLinks = [
  { href: "/dashboard/apps/xclay", label: "Xclay", detail: "Lead enrichment", icon: ScanSearch, kind: "App" },
  { href: "/dashboard/apps", label: "Xfunnel", detail: "Funnel planning", icon: Calculator, kind: "App" },
  { href: "/dashboard/agents", label: "Vibe Prospecting", detail: "B2B lead search", icon: Bot, kind: "Agent" },
];

function websiteHref(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function updatedDate(value?: string) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(timestamp);
}

function scoreColor(value: number, t: LandingThemeTokens) {
  if (value >= 90) return t.isDark ? "#78b9a8" : "#2b796c";
  if (value >= 50) return t.gold;
  return t.isDark ? "#e08b78" : "#bd5948";
}

function ScoreCard({ label, shortLabel, value, t }: { label: string; shortLabel: string; value: number; t: LandingThemeTokens }) {
  const color = scoreColor(value, t);
  const progress = Math.max(0, Math.min(100, value));
  return (
    <div className="flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 sm:flex-row sm:justify-start sm:gap-3 sm:px-4 lg:flex-col lg:justify-center xl:flex-row xl:justify-start [@media(max-height:700px)]:gap-1 [@media(max-height:700px)]:py-2" style={{ background: t.card, borderColor: t.border }} title={`${label}: ${value} out of 100`}>
      <div className="grid h-12 w-12 flex-none place-items-center rounded-full p-[4px] sm:h-14 sm:w-14 lg:h-16 lg:w-16 [@media(max-height:700px)]:h-11 [@media(max-height:700px)]:w-11" style={{ background: `conic-gradient(${color} ${progress}%, ${t.barInactive} 0)` }}>
        <div className="grid h-full w-full place-items-center rounded-full text-sm font-semibold" style={{ background: t.card, color: t.fg }}>{value}</div>
      </div>
      <div className="min-w-0 text-center sm:text-left lg:text-center xl:text-left">
        <p className="hidden truncate text-xs font-semibold sm:block" style={{ color: t.fg }}>{label}</p>
        <p className="truncate text-[10px] font-semibold sm:hidden" style={{ color: t.fg }}>{shortLabel}</p>
        <p className="hidden text-[11px] sm:block" style={{ color: t.fgMid }}>out of 100</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useLandingTheme();
  const project = useAppSelector((state) => state.auth.project);
  const [tab, setTab] = useState<DashboardTab>("overview");
  const website = websiteHref(project?.website_url ?? null);
  const lastUpdated = updatedDate(project?.updated_at);
  const pagesFetched = project?.website_information?.pages_fetched;
  const lighthouse = project?.lighthouse_metrics;
  const icp = project?.icp;
  const competitors = (project?.competitors || []).filter((item) => item.name.trim().toLowerCase() !== project?.project_name.trim().toLowerCase());
  const scoreData = lighthouse ? [
    { label: "SEO", shortLabel: "SEO", value: lighthouse.seo_score },
    { label: "Performance", shortLabel: "Speed", value: lighthouse.performance_score },
    { label: "Accessibility", shortLabel: "Access", value: lighthouse.accessibility_score },
    { label: "Best practices", shortLabel: "Quality", value: lighthouse.best_practices_score },
  ] : [];
  const panel = { background: t.card, borderColor: t.border };

  return (
    <div className="archivo-font fixed inset-0 overflow-hidden px-4 pb-4 pt-24 sm:px-6 lg:px-10 lg:pb-7 lg:pt-[104px] [@media(max-height:700px)]:pt-20 [@media(max-height:520px)]:pt-16" style={{ color: t.fg, background: t.isDark ? "transparent" : t.bg }}>
      <main className="mx-auto h-full min-h-0 w-full max-w-[1320px]">
        <EmailVerificationGate>
          <div className="flex h-full min-h-0 flex-col">
            <header className="flex flex-none items-end justify-between gap-4 pb-4 lg:pb-5 [@media(max-height:700px)]:pb-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase [@media(max-height:520px)]:hidden" style={{ color: t.gold }}>Dashboard / Active project</p>
                <h1 className="mt-1 truncate text-[23px] font-semibold sm:text-[28px]" title={project?.project_name || "Your workspace"}>{project?.project_name || "Your workspace"}</h1>
              </div>
              {project && <Link href="/dashboard/project" className="inline-flex h-9 flex-none items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-opacity hover:opacity-70 sm:text-sm" style={{ borderColor: t.border, color: t.gold, background: t.card }}>Project details <ArrowRight size={15} /></Link>}
            </header>

            {project ? <>
              <div className="mb-3 flex flex-none gap-1 rounded-xl p-1 lg:hidden" style={{ background: t.card, border: `1px solid ${t.border}` }} role="tablist" aria-label="Dashboard views">
                {(["overview", "insights", "quick-use"] as DashboardTab[]).map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className="min-w-0 flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors" style={{ color: tab === item ? t.fg : t.fgMid, background: tab === item ? t.goldDim : "transparent" }}>{item === "quick-use" ? "Quick Use" : item === "insights" ? "Insights" : "Overview"}</button>)}
              </div>

              <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
                <div className="flex min-h-0 min-w-0 flex-col gap-4 [@media(max-height:700px)]:gap-3">
                  <section className={`${tab === "overview" ? "block" : "hidden"} lg:block`} aria-label="Website health">
                    <div className="mb-2 flex items-baseline justify-between gap-3"><h2 className="text-sm font-semibold">Website health</h2>{lighthouse?.is_estimate && <span className="text-[11px]" style={{ color: t.fgMid }}>Estimated scores</span>}</div>
                    {scoreData.length ? <div className="grid grid-cols-4 gap-2 sm:gap-3">{scoreData.map((score) => <ScoreCard key={score.label} {...score} t={t} />)}</div> : <div className="rounded-xl border px-4 py-5 text-xs" style={{ ...panel, color: t.fgMid }}>No website scores available yet.</div>}
                  </section>

                  <section className={`${tab === "insights" ? "block" : "hidden"} min-h-0 lg:block`} aria-label="Market insights">
                    <div className="mb-2 flex items-baseline justify-between gap-3"><h2 className="text-sm font-semibold">Market insights</h2><Link href="/dashboard/project" className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline" style={{ color: t.gold }}>Full analysis <ArrowRight size={12} /></Link></div>
                    <div className="grid min-h-0 gap-3 sm:grid-cols-2">
                      <div className="min-w-0 rounded-2xl border p-4 [@media(max-height:700px)]:p-3" style={panel}>
                        <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: t.goldDim, color: t.gold }}><Users size={16} /></span><h3 className="text-xs font-semibold">Ideal customer</h3></div>
                        {icp ? <>
                          <p className="mt-3 line-clamp-3 text-xs leading-relaxed [@media(max-height:520px)]:line-clamp-2" style={{ color: t.fgMid }}>{icp.target_audience || "Audience description is not available."}</p>
                          {(icp.demographics?.company_size || icp.demographics?.role_titles?.length) && <div className="mt-3 flex flex-wrap gap-1.5 [@media(max-height:520px)]:hidden">
                            {icp.demographics?.company_size && <span className="max-w-full truncate rounded-md px-2 py-1 text-[10px]" style={{ background: t.goldDim, color: t.gold }}>{icp.demographics.company_size}</span>}
                            {icp.demographics?.role_titles?.slice(0, 2).map((role) => <span key={role} className="max-w-full truncate rounded-md border px-2 py-1 text-[10px]" style={{ borderColor: t.border, color: t.fgMid }}>{role}</span>)}
                          </div>}
                        </> : <p className="mt-3 text-xs" style={{ color: t.fgMid }}>No ideal customer profile yet.</p>}
                      </div>

                      <div className="min-w-0 rounded-2xl border p-4 [@media(max-height:700px)]:p-3" style={panel}>
                        <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: t.goldDim, color: t.gold }}><ScanSearch size={16} /></span><h3 className="text-xs font-semibold">Likely competitors</h3></div>
                        {competitors.length ? <div className="mt-3 space-y-2">
                          {competitors.slice(0, 3).map((item, index) => <div key={item.name} className={`flex min-w-0 items-center gap-2 ${index > 1 ? "[@media(max-height:520px)]:hidden" : ""}`} title={item.reason}><span className="grid h-7 w-7 flex-none place-items-center rounded-lg text-[11px] font-semibold" style={{ background: t.goldDim, color: t.gold }}>{item.name.charAt(0).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-xs font-medium">{item.name}</span><span className="block truncate text-[10px] [@media(max-height:520px)]:hidden" style={{ color: t.fgMid }}>{item.reason}</span></span></div>)}
                          {competitors.length > 3 && <p className="text-[10px] [@media(max-height:700px)]:hidden" style={{ color: t.fgMid }}>+{competitors.length - 3} more in project details</p>}
                        </div> : <p className="mt-3 text-xs" style={{ color: t.fgMid }}>No competitor analysis yet.</p>}
                      </div>
                    </div>
                  </section>
                </div>

                <aside className="flex min-h-0 min-w-0 flex-col gap-4 [@media(max-height:700px)]:gap-3">
                  <section className={`${tab === "overview" ? "block" : "hidden"} rounded-2xl border p-4 lg:block [@media(max-height:700px)]:p-3`} style={panel} aria-label="Project scan">
                    <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: t.goldDim, color: t.gold }}><Globe size={16} /></span><h2 className="text-xs font-semibold">Project scan</h2></div>
                    <div className="mt-3 flex items-end justify-between gap-3 border-b pb-3" style={{ borderColor: t.border }}><div><p className="text-[11px]" style={{ color: t.fgMid }}>Pages scanned</p><p className="mt-1 text-2xl font-semibold leading-none">{typeof pagesFetched === "number" ? pagesFetched : "-"}</p></div><FileText size={26} style={{ color: t.gold }} /></div>
                    <div className="mt-3 flex min-w-0 items-center gap-2 text-[11px]" style={{ color: t.fgMid }}><ExternalLink size={12} className="flex-none" />{website ? <a href={website} target="_blank" rel="noopener noreferrer" className="truncate hover:underline" title={project.website_url || undefined}>{project.website_url}</a> : <span className="truncate">{project.website_url || "No website added"}</span>}</div>
                    {lastUpdated && <p className="mt-2 flex items-center gap-1 text-[10px] [@media(max-height:520px)]:hidden" style={{ color: t.fgMid }}><Clock3 size={11} /> Updated {lastUpdated}</p>}
                  </section>

                  <section className={`${tab === "quick-use" ? "block" : "hidden"} rounded-2xl border p-4 lg:block [@media(max-height:700px)]:p-3`} style={panel} aria-label="Quick Use">
                    <div className="flex items-baseline justify-between gap-2"><h2 className="text-sm font-semibold">Quick Use</h2><span className="text-[11px]" style={{ color: t.fgMid }}>Apps & agents</span></div>
                    <nav className="mt-2 divide-y" style={{ borderColor: t.border }} aria-label="Quick Use links">
                      {quickLinks.map(({ href, label, detail, icon: Icon, kind }) => <Link key={href} href={href} className="group flex min-h-[59px] items-center gap-3 py-2 transition-opacity hover:opacity-70" style={{ borderColor: t.border }}><span className="grid h-9 w-9 flex-none place-items-center rounded-lg" style={{ background: t.goldDim, color: t.gold }}><Icon size={18} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{label}</span><span className="block truncate text-[11px]" style={{ color: t.fgMid }}>{kind} · {detail}</span></span><ArrowRight size={15} className="flex-none transition-transform group-hover:translate-x-1" style={{ color: t.fgMid }} /></Link>)}
                    </nav>
                  </section>
                </aside>
              </div>
            </> : <div className="flex min-h-0 flex-1 items-center justify-center text-center"><div><p className="text-base font-medium">No project selected</p><p className="mt-2 text-sm" style={{ color: t.fgMid }}>Select a project from the navigation to see its overview.</p></div></div>}
          </div>
        </EmailVerificationGate>
      </main>
    </div>
  );
}
