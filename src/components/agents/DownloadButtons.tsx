"use client";

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
  const enabled = !!downloadUrl;
  const filename = `vibe-prospecting-export`;
  const xlsxHref = enabled ? `/api/agents/export-xlsx?url=${encodeURIComponent(downloadUrl!)}&filename=${encodeURIComponent(filename)}` : undefined;

  const baseBtn = "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors";
  const enabledBtn =
    variant === "solid" ? "bg-[var(--gold-primary)] text-black hover:brightness-110" : "bg-black/25 text-[var(--gold-primary)] hover:bg-black/40";
  const disabledBtn = variant === "solid" ? "bg-[#151515] text-gray-600 cursor-not-allowed" : "bg-black/15 text-gray-600 cursor-not-allowed";
  const borderColor = enabled ? "border-[var(--gold-primary)]/60" : "border-[#2a2a2a]";
  const dividerColor = enabled ? (variant === "solid" ? "bg-black/25" : "bg-white/10") : "bg-[#2a2a2a]";

  return (
    <div className={`inline-flex items-stretch rounded-lg overflow-hidden border ${borderColor}`}>
      <a
        href={enabled ? downloadUrl! : undefined}
        target="_blank"
        rel="noreferrer"
        aria-disabled={!enabled}
        onClick={(e) => {
          if (!enabled) e.preventDefault();
        }}
        title={enabled ? `Download ${rowCount ?? ""} rows as CSV` : "No export available yet"}
        className={`${baseBtn} ${enabled ? enabledBtn : disabledBtn}`}
      >
        <DownloadIcon />
        CSV
      </a>
      <span className={`w-px ${dividerColor}`} />
      <a
        href={xlsxHref}
        aria-disabled={!enabled}
        onClick={(e) => {
          if (!enabled) e.preventDefault();
        }}
        title={enabled ? `Download ${rowCount ?? ""} rows as XLSX` : "No export available yet"}
        className={`${baseBtn} ${enabled ? enabledBtn : disabledBtn}`}
      >
        <DownloadIcon />
        XLSX
      </a>
    </div>
  );
}
