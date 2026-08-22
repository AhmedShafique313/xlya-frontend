"use client";

import { useAppSelector } from "@/redux/hooks";

const SCORE_LABELS: Array<{ key: "seo_score" | "performance_score" | "accessibility_score" | "best_practices_score"; label: string }> = [
  { key: "seo_score", label: "SEO" },
  { key: "performance_score", label: "Performance" },
  { key: "accessibility_score", label: "Accessibility" },
  { key: "best_practices_score", label: "Best Practices" },
];

function scoreColor(score: number) {
  if (score >= 90) return "var(--gold-primary)";
  if (score >= 50) return "#e0c06b";
  return "#e0806b";
}

// Real, per-project market analysis generated at signup (website scan +
// NVIDIA-derived ICP/competitors) — only populated when a website URL was
// given. Everything else on this dashboard is still static placeholder data
// (see project_dashboard_ui_design memory); this is the first section wired
// to actual backend output.
export default function MarketAnalysis() {
  const project = useAppSelector((state) => state.auth.project);

  if (!project) return null;

  if (!project.website_url) {
    return (
      <div className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-5.5 mb-4 text-center">
        <p className="text-[13px] font-medium text-[#9a9a9a] mb-1">No website analysis yet</p>
        <p className="text-[12px] text-[#6b6b6b]">
          Add a website URL to a project to get AI-generated ICP, competitor, and performance insights here.
        </p>
      </div>
    );
  }

  const { lighthouse_metrics: lighthouse, icp, competitors } = project;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 text-[13px] font-medium text-[#9a9a9a] mb-3">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        Website &amp; Market Analysis
        <span className="text-[11px] font-normal text-[#5c5c5c]">— {project.website_url}</span>
      </div>

      {lighthouse && (
        <div className="grid grid-cols-4 gap-4 mb-4">
          {SCORE_LABELS.map(({ key, label }) => (
            <div key={key} className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-xl p-5">
              <div className="text-[12.5px] font-medium text-[#9a9a9a] mb-3.5">{label}</div>
              <div className="text-[26px] font-bold" style={{ color: scoreColor(lighthouse[key]) }}>
                {lighthouse[key]}
                <span className="text-[15px] text-[#6b6b6b] font-medium">/100</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {lighthouse?.is_estimate && (
        <p className="text-[10.5px] text-[#5c5c5c] mb-4 -mt-2">{lighthouse.note}</p>
      )}

      {(icp || competitors) && (
        <div className="grid gap-4" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
          {icp && (
            <div className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-5.5">
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#9a9a9a] mb-4">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
                Ideal Customer Profile
              </div>

              <p className="text-[13px] text-[#f4f0e8] leading-relaxed mb-4">{icp.target_audience}</p>

              {icp.demographics && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {icp.demographics.age_range && (
                    <span className="border border-[#232323] rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#9a9a9a]">
                      Age {icp.demographics.age_range}
                    </span>
                  )}
                  {icp.demographics.company_size && (
                    <span className="border border-[#232323] rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#9a9a9a]">
                      {icp.demographics.company_size}
                    </span>
                  )}
                  {icp.demographics.role_titles?.map((title) => (
                    <span
                      key={title}
                      className="rounded-lg px-2.5 py-1 text-[11px] font-medium"
                      style={{ color: "var(--gold-primary)", background: "rgba(204,172,93,0.12)" }}
                    >
                      {title}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                {icp.pain_points && icp.pain_points.length > 0 && (
                  <div>
                    <div className="text-[10.5px] font-semibold tracking-[0.06em] text-[#5c5c5c] mb-2">PAIN POINTS</div>
                    <ul className="space-y-1.5">
                      {icp.pain_points.map((p) => (
                        <li key={p} className="text-[11.5px] text-[#9a9a9a] leading-snug">{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {icp.motivations && icp.motivations.length > 0 && (
                  <div>
                    <div className="text-[10.5px] font-semibold tracking-[0.06em] text-[#5c5c5c] mb-2">MOTIVATIONS</div>
                    <ul className="space-y-1.5">
                      {icp.motivations.map((m) => (
                        <li key={m} className="text-[11.5px] text-[#9a9a9a] leading-snug">{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {icp.buying_triggers && icp.buying_triggers.length > 0 && (
                  <div>
                    <div className="text-[10.5px] font-semibold tracking-[0.06em] text-[#5c5c5c] mb-2">BUYING TRIGGERS</div>
                    <ul className="space-y-1.5">
                      {icp.buying_triggers.map((b) => (
                        <li key={b} className="text-[11.5px] text-[#9a9a9a] leading-snug">{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {competitors && competitors.length > 0 && (
            <div className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-5.5">
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#9a9a9a] mb-4">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
                  <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
                </svg>
                Likely Competitors
              </div>
              <div className="space-y-3.5">
                {competitors.map((c) => (
                  <div key={c.name} className="border-b border-[#161616] pb-3.5 last:border-0 last:pb-0">
                    <div className="text-[13px] font-semibold text-[#f4f0e8] mb-1">{c.name}</div>
                    <div className="text-[11.5px] text-[#7d7d7d] leading-snug">{c.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!icp && !competitors && (
        <div className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-5.5 text-center">
          <p className="text-[12.5px] text-[#6b6b6b]">
            ICP and competitor analysis wasn&apos;t generated for this project.
          </p>
        </div>
      )}
    </div>
  );
}
