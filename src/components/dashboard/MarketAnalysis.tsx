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

  // A generated competitor that's actually the user's own brand (same name
  // as the project) isn't a real competitor — drop it rather than showing
  // the project competing against itself.
  const projectNameNormalized = project.project_name?.trim().toLowerCase();
  const filteredCompetitors = (competitors || []).filter(
    (c) => c.name.trim().toLowerCase() !== projectNameNormalized
  );

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 text-[13px] font-medium text-[#9a9a9a] mb-3">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span>
          Market Analytics of{" "}
          <span className="font-semibold" style={{ color: "var(--gold-primary)" }}>
            {project.project_name}
          </span>
        </span>
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

              {(() => {
                const categories = [
                  { key: "pain_points", label: "Pain Points", items: icp.pain_points || [], color: "var(--gold-primary)" },
                  { key: "motivations", label: "Motivations", items: icp.motivations || [], color: "var(--gold-secondary)" },
                  { key: "buying_triggers", items: icp.buying_triggers || [], label: "Buying Triggers", color: "#8a7440" },
                ] as const;
                const total = categories.reduce((sum, c) => sum + c.items.length, 0);
                let cumulative = 0;
                const segments = categories.map((c) => {
                  const dash = total > 0 ? (c.items.length / total) * 440 : 0;
                  const seg = { ...c, dash, dashOffset: -cumulative };
                  cumulative += dash;
                  return seg;
                });

                return (
                  <>
                    {/* Graphical summary — donut of insight-category volume + a
                        per-category bar breakdown, rendered before the text
                        detail so the card reads chart-first. */}
                    {total > 0 && (
                      <div className="flex items-center gap-6 mb-5 pb-5 border-b border-[#1c1c1c]">
                        <div className="relative flex-none">
                          <svg width="112" height="112" viewBox="0 0 180 180">
                            <circle cx="90" cy="90" r="70" fill="none" stroke="#1c1c1c" strokeWidth="20" />
                            {segments.map((seg) =>
                              seg.dash > 0 ? (
                                <circle
                                  key={seg.key}
                                  cx="90"
                                  cy="90"
                                  r="70"
                                  fill="none"
                                  stroke={seg.color}
                                  strokeWidth="20"
                                  strokeDasharray={`${seg.dash} 440`}
                                  strokeDashoffset={seg.dashOffset}
                                  transform="rotate(-90 90 90)"
                                />
                              ) : null
                            )}
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-lg font-bold text-[#f4f0e8]">{total}</div>
                            <div className="text-[9px] text-[#6b6b6b]">insights</div>
                          </div>
                        </div>
                        <div className="flex-1 space-y-2.5">
                          {segments.map((seg) => (
                            <div key={seg.key}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full flex-none" style={{ background: seg.color }} />
                                  <span className="text-[11.5px] font-medium text-[#9a9a9a]">{seg.label}</span>
                                </div>
                                <span className="text-[11.5px] font-semibold text-[#f4f0e8]">{seg.items.length}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-[#1c1c1c] overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${total > 0 ? (seg.items.length / total) * 100 : 0}%`, background: seg.color }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div
                      className="rounded-xl p-4 mb-4"
                      style={{ background: "rgba(204,172,93,0.06)", border: "1px solid rgba(204,172,93,0.18)" }}
                    >
                      <p className="text-[13px] text-[#f4f0e8] leading-relaxed">{icp.target_audience}</p>
                    </div>

                    {icp.demographics && (
                      <div className="flex flex-wrap gap-2 mb-5">
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

                    <div className="grid grid-cols-3 gap-5">
                      {segments.map((seg) =>
                        seg.items.length > 0 ? (
                          <div key={seg.key}>
                            <div className="flex items-center gap-1.5 mb-2.5">
                              <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: seg.color }} />
                              <div className="text-[10.5px] font-semibold tracking-[0.06em] text-[#5c5c5c]">
                                {seg.label.toUpperCase()}
                              </div>
                            </div>
                            <ul className="space-y-2">
                              {seg.items.map((item) => (
                                <li key={item} className="flex items-start gap-1.5 text-[11.5px] text-[#9a9a9a] leading-snug">
                                  <span
                                    className="mt-[5px] w-1 h-1 rounded-full flex-none"
                                    style={{ background: seg.color }}
                                  />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <div className="flex flex-col gap-4">
            {filteredCompetitors.length > 0 && (
              <div className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-5.5">
                <div className="flex items-center gap-2 text-[13px] font-medium text-[#9a9a9a] mb-4">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
                    <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
                  </svg>
                  Likely Competitors
                </div>
                <div className="space-y-3.5">
                  {filteredCompetitors.map((c) => (
                    <div key={c.name} className="border-b border-[#161616] pb-3.5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-[26px] h-[26px] flex-none rounded-lg flex items-center justify-center text-xs font-bold text-[#0a0a0a]"
                          style={{ background: "var(--gold-primary)" }}
                        >
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[13px] font-semibold text-[#f4f0e8]">{c.name}</span>
                      </div>
                      <div className="text-[11.5px] text-[#7d7d7d] leading-snug mt-1.5 ml-9">{c.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Placeholder terminal-style activity log — purely decorative
                dummy output for now, sized to absorb whatever vertical space
                is left in this column so it lines up with the taller ICP
                card next to it. Wire this up to real activity events later. */}
            <div className="flex-1 min-h-[180px] border border-[#1c1c1c] bg-[#0a0a0a] rounded-2xl overflow-hidden flex flex-col">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#1c1c1c] bg-[#111111]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e0806b]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#e0c06b]" />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--gold-primary)" }} />
                <span className="ml-2 text-[11px] font-medium text-[#6b6b6b] font-mono">activity · bash</span>
              </div>
              <div className="flex-1 px-4 py-3.5 font-mono text-[11.5px] leading-relaxed overflow-hidden">
                <p className="text-[#6b6b6b]">
                  <span style={{ color: "var(--gold-primary)" }}>➜</span> xlya git:(main) analyze --project {project.project_name}
                </p>
                <p className="text-[#7d7d7d]">[1/5] scanning website structure...</p>
                <p className="text-[#7d7d7d]">[2/5] running lighthouse audit... <span style={{ color: "var(--gold-primary)" }}>done</span></p>
                <p className="text-[#7d7d7d]">[3/5] generating ideal customer profile...</p>
                <p className="text-[#7d7d7d]">[4/5] identifying likely competitors... <span style={{ color: "var(--gold-primary)" }}>done</span></p>
                <p className="text-[#7d7d7d]">[5/5] compiling market analytics report</p>
                <p className="text-[#4d9a6a]">✔ analysis complete, 0 errors, 0 warnings</p>
                <p className="text-[#6b6b6b] mt-1">
                  <span style={{ color: "var(--gold-primary)" }}>➜</span> xlya git:(main){" "}
                  <span className="inline-block w-[6px] h-[13px] align-middle animate-pulse" style={{ background: "var(--gold-primary)" }} />
                </p>
              </div>
            </div>
          </div>
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
