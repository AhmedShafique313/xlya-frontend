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

  const { lighthouse_metrics: lighthouse } = project;

  return (
    <div className="mb-4">
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

    </div>
  );
}
