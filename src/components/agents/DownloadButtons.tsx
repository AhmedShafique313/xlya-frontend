"use client";

import { useLandingTheme } from "@/components/landingPage/landingTheme";

const DownloadIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

interface DownloadButtonsProps {
  /** null/undefined = no export available yet — both options render greyed
   *  out and inert instead of being hidden, so the control's highlighted vs.
   *  idle state is always visible in the same place. */
  downloadUrl?: string | null;
  rowCount?: number;
  /** "subtle" sits inside an already-dark chat bubble; "solid" is the
   *  standalone gold pill used in the panel header. */
  variant?: "solid" | "subtle";
}

// A single pill containing both export formats — CSV downloads the file the
// lambda already produced (a direct link, no conversion needed); XLSX routes
// through /api/agents/export-xlsx, a same-origin Next.js route that fetches
// the CSV server-side and converts it, since the xlya-dev-s3 bucket has no
// CORS configuration and the browser can't fetch the presigned URL itself to
// convert it client-side. Only lights up gold once a real download_url
// exists for the current job — otherwise both options are visibly disabled,
// per the "highlighted only once the user actually has rows" requirement.
export default function DownloadButtons({ downloadUrl, rowCount, variant = "solid" }: DownloadButtonsProps) {
  const { t } = useLandingTheme();
  const enabled = !!downloadUrl;
  const filename = `vibe-prospecting-export`;
  const xlsxHref = enabled ? `/api/agents/export-xlsx?url=${encodeURIComponent(downloadUrl!)}&filename=${encodeURIComponent(filename)}` : undefined;

  const baseBtn = "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors";
  const btnStyle: React.CSSProperties = enabled
    ? variant === "solid"
      ? { background: t.gold, color: t.isDark ? "#0a0a0a" : "#faf8f4" }
      : { background: "rgba(0,0,0,0.25)", color: t.gold }
    : variant === "solid"
    ? { background: t.surface, color: t.fgFaint, cursor: "not-allowed" }
    : { background: "rgba(0,0,0,0.15)", color: t.fgFaint, cursor: "not-allowed" };
  const borderColor = enabled ? `${t.gold}99` : t.border;
  const dividerColor = enabled ? (variant === "solid" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.1)") : t.border;

  return (
    <div className="inline-flex items-stretch rounded-lg overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
      <a
        href={enabled ? downloadUrl! : undefined}
        target="_blank"
        rel="noreferrer"
        aria-disabled={!enabled}
        onClick={(e) => {
          if (!enabled) e.preventDefault();
        }}
        title={enabled ? `Download ${rowCount ?? ""} rows as CSV` : "No export available yet"}
        className={baseBtn}
        style={btnStyle}
      >
        <DownloadIcon />
        CSV
      </a>
      <span className="w-px" style={{ background: dividerColor }} />
      <a
        href={xlsxHref}
        aria-disabled={!enabled}
        onClick={(e) => {
          if (!enabled) e.preventDefault();
        }}
        title={enabled ? `Download ${rowCount ?? ""} rows as XLSX` : "No export available yet"}
        className={baseBtn}
        style={btnStyle}
      >
        <DownloadIcon />
        XLSX
      </a>
    </div>
  );
}
