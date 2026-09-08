"use client";

import { useAppSelector } from "@/redux/hooks";
import { useLandingTheme } from "@/components/landingPage/landingTheme";
import type { LandingThemeTokens } from "@/components/landingPage/landingTheme";

const SCORE_LABELS: Array<{ key: "seo_score" | "performance_score" | "accessibility_score" | "best_practices_score"; label: string }> = [
  { key: "seo_score", label: "SEO" },
  { key: "performance_score", label: "Performance" },
  { key: "accessibility_score", label: "Accessibility" },
  { key: "best_practices_score", label: "Best Practices" },
];

function scoreColor(score: number, t: LandingThemeTokens) {
  if (score >= 90) return t.gold;
  if (score >= 50) return "#e0c06b";
  return "#e0806b";
}

// Real, per-project market analysis generated at signup (website scan +
// NVIDIA-derived ICP/competitors) — only populated when a website URL was
// given. Everything else on this dashboard is still static placeholder data
// (see project_dashboard_ui_design memory); this is the first section wired
// to actual backend output.
export default function MarketAnalysis() {
  const { t } = useLandingTheme();
  const project = useAppSelector((state) => state.auth.project);

  if (!project) return null;

  if (!project.website_url) {
    return (
      <div className="rounded-2xl p-5.5 mb-4 text-center" style={{ border: `1px solid ${t.border}`, background: t.card }}>
        <p className="text-[13px] font-medium mb-1" style={{ color: t.fgMid }}>No website analysis yet</p>
        <p className="text-[12px]" style={{ color: t.fgFaint }}>
          Add a website URL to a project to get AI-generated ICP, competitor, and performance insights here.
        </p>
      </div>
    );
  }

  const { lighthouse_metrics: lighthouse, icp, competitors } = project;

  // The NVIDIA-generated competitor list sometimes lists the project's own
  // brand as if it were a competitor — drop any entry whose name matches
  // project_name (case-insensitive, trimmed) before rendering.
  const ownName = project.project_name.trim().toLowerCase();
  const realCompetitors = (competitors || []).filter((c) => c.name.trim().toLowerCase() !== ownName);

  const hasIcp = !!icp;
  const hasCompetitors = realCompetitors.length > 0;

  return (
    <div className="mb-4">
      {lighthouse && (
        <div className="grid grid-cols-4 gap-4 mb-4">
          {SCORE_LABELS.map(({ key, label }) => (
            <div key={key} className="rounded-xl p-5" style={{ border: `1px solid ${t.border}`, background: t.card }}>
              <div className="text-[12.5px] font-medium mb-3.5" style={{ color: t.fgMid }}>{label}</div>
              <div className="text-[26px] font-bold" style={{ color: scoreColor(lighthouse[key], t) }}>
                {lighthouse[key]}
                <span className="text-[15px] font-medium" style={{ color: t.fgFaint }}>/100</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {lighthouse?.is_estimate && (
        <p className="text-[10.5px] mb-4 -mt-2" style={{ color: t.fgFaint }}>{lighthouse.note}</p>
      )}

      {(hasIcp || hasCompetitors) && (
        <div className="grid gap-4 items-start" style={{ gridTemplateColumns: hasIcp && hasCompetitors ? "1.3fr 1fr" : "1fr" }}>
          {hasIcp && icp && (
            <div className="rounded-2xl p-5.5" style={{ border: `1px solid ${t.border}`, background: t.card }}>
              <div className="flex items-center gap-2 text-[13px] font-medium mb-4" style={{ color: t.fgMid }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.gold} strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" />
                </svg>
                Ideal Customer Profile
              </div>

              {icp.target_audience && (
                <div className="rounded-xl px-4 py-3 mb-4" style={{ border: `1px solid ${t.gold}33`, background: t.goldDim }}>
                  <p className="text-[12.5px] leading-relaxed" style={{ color: t.fg }}>{icp.target_audience}</p>
                </div>
              )}

              {icp.demographics && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {icp.demographics.age_range && (
                    <span className="text-[11px] font-medium rounded-lg px-2.5 py-1" style={{ color: t.fgMid, border: `1px solid ${t.border}` }}>
                      Age {icp.demographics.age_range}
                    </span>
                  )}
                  {icp.demographics.company_size && (
                    <span className="text-[11px] font-medium rounded-lg px-2.5 py-1" style={{ color: t.fgMid, border: `1px solid ${t.border}` }}>
                      {icp.demographics.company_size}
                    </span>
                  )}
                  {icp.demographics.role_titles?.map((role) => (
                    <span key={role} className="text-[11px] font-medium rounded-lg px-2.5 py-1" style={{ color: t.fgMid, border: `1px solid ${t.border}` }}>
                      {role}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Pain points", items: icp.pain_points, dot: t.gold },
                  { label: "Motivations", items: icp.motivations, dot: t.isDark ? "#8a7440" : "#c4a55a" },
                  { label: "Buying triggers", items: icp.buying_triggers, dot: t.isDark ? "#5c4d2c" : "#a68a3f" },
                ].map(
                  ({ label, items, dot }) =>
                    items &&
                    items.length > 0 && (
                      <div key={label}>
                        <div className="text-[10.5px] font-semibold tracking-[0.06em] uppercase mb-2" style={{ color: t.fgFaint }}>{label}</div>
                        <ul className="space-y-1.5">
                          {items.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-[11.5px] leading-relaxed" style={{ color: t.fgMid }}>
                              <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-none" style={{ background: dot }} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {hasCompetitors && (
            <div className="rounded-2xl p-5.5" style={{ border: `1px solid ${t.border}`, background: t.card }}>
              <div className="flex items-center gap-2 text-[13px] font-medium mb-4" style={{ color: t.fgMid }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.gold} strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
                Likely Competitors
              </div>
              <div className="space-y-4">
                {realCompetitors.map((c) => (
                  <div key={c.name}>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-[26px] h-[26px] flex-none rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: t.gold, color: t.isDark ? "#0a0a0a" : "#faf8f4" }}
                      >
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[13px] font-medium" style={{ color: t.fg }}>{c.name}</span>
                    </div>
                    <p className="text-[11.5px] leading-relaxed ml-9 mt-1" style={{ color: t.fgMid }}>{c.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
