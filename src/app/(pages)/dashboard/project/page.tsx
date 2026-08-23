"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/redux/hooks";
import { streamSettings, SettingsUser } from "@/lib/api/settingsStream";
import MarketAnalysis from "@/components/dashboard/MarketAnalysis";
import { BUSINESS_TYPE_OPTIONS, CHALLENGE_OPTIONS, TEAM_SIZE_OPTIONS } from "@/constants/onboarding";

export default function ProjectDetailsPage() {
  const project = useAppSelector((state) => state.auth.project);
  const accessToken = useAppSelector((state) => state.auth.tokens.accessToken);
  const [settings, setSettings] = useState<SettingsUser | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    streamSettings(accessToken, { action: "get" }, (event) => {
      if (cancelled) return;
      if (event.type === "result" && event.statusCode === 200 && event.user) {
        setSettings(event.user);
      }
    }).catch((err) => {
      console.error("Failed to load business profile for project details:", err);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 text-[#f4f0e8]">
        <p className="text-sm text-gray-500">No project found.</p>
      </div>
    );
  }

  const businessTypeLabel = BUSINESS_TYPE_OPTIONS.find((o) => o.value === settings?.businessType)?.label;
  const challengeLabel = CHALLENGE_OPTIONS.find((o) => o.value === settings?.challenge)?.label;
  const teamSizeLabel = TEAM_SIZE_OPTIONS.find((o) => o.value === settings?.teamSize)?.label;
  const hasBusinessProfile = businessTypeLabel || challengeLabel || teamSizeLabel;

  const createdLabel = project.created_at
    ? new Date(project.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="min-h-screen flex justify-center p-6 md:p-10 pt-24 text-[#f4f0e8]">
      <div className="w-full max-w-[1440px] min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-white">{project.project_name}</h1>
          {project.isDefault && (
            <span
              className="text-[10px] font-semibold tracking-[0.06em] uppercase px-2 py-1 rounded-md"
              style={{ color: "var(--gold-primary)", background: "rgba(204,172,93,0.12)" }}
            >
              Default project
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-8">
          {project.website_url || "No website added"}
          {createdLabel && <> · Created {createdLabel}</>}
        </p>

        <div className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-6 mb-4">
          <h2 className="text-sm font-semibold text-white mb-4">Business profile</h2>
          {hasBusinessProfile ? (
            <div className="flex flex-wrap gap-2">
              {businessTypeLabel && (
                <span className="border border-[#232323] rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#9a9a9a]">
                  {businessTypeLabel}
                </span>
              )}
              {challengeLabel && (
                <span className="border border-[#232323] rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#9a9a9a]">
                  {challengeLabel}
                </span>
              )}
              {teamSizeLabel && (
                <span className="border border-[#232323] rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#9a9a9a]">
                  {teamSizeLabel}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No business profile set yet.</p>
          )}
        </div>

        <MarketAnalysis />
      </div>
    </div>
  );
}
