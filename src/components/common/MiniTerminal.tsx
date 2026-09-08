"use client";

import { useLandingTheme } from "@/components/landingPage/landingTheme";

export interface MiniTerminalLine {
  text: string;
  status: "active" | "done" | "error";
}

interface MiniTerminalProps {
  /** The single most recent step for whatever action this instance is
   *  attached to — null when nothing has run yet. */
  line: MiniTerminalLine | null;
  idleLabel?: string;
}

// Minimized, single-line counterpart to TerminalLog — meant to live inside
// an individual card (Description / Knowledge base / Danger zone) and show
// only that card's own most recent streamed NDJSON step, not a shared
// cross-card history. Each card that calls a streaming action owns its own
// MiniTerminalLine state and passes it in here.
export default function MiniTerminal({ line, idleLabel = "Ready" }: MiniTerminalProps) {
  const { t } = useLandingTheme();

  const textColor = !line
    ? t.fgFaint
    : line.status === "error"
    ? "#f87171"
    : line.status === "done"
    ? t.fgMid
    : t.fg;

  return (
    <div
      className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-mono text-[11px] overflow-hidden"
      style={{ border: `1px solid ${t.border}`, background: t.bg }}
    >
      <div className="flex items-center gap-1 flex-none">
        <span className="w-2 h-2 rounded-full" style={{ background: "#ff5f57" }} />
        <span className="w-2 h-2 rounded-full" style={{ background: "#febc2e" }} />
        <span className="w-2 h-2 rounded-full" style={{ background: t.gold }} />
      </div>
      <span className="flex-none" style={{ color: t.gold }}>$</span>
      <span className="truncate" style={{ color: textColor }}>{line ? line.text : idleLabel}</span>
      {line?.status === "active" && (
        <span className="inline-block w-1.5 h-3 flex-none animate-pulse" style={{ background: t.gold }} />
      )}
    </div>
  );
}
