"use client";

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

const DOT_COLORS = ["#ff5f57", "#febc2e", "var(--gold-primary)"];

// Minimized, single-line counterpart to TerminalLog — meant to live inside
// an individual card (Description / Knowledge base / Danger zone) and show
// only that card's own most recent streamed NDJSON step, not a shared
// cross-card history. Each card that calls a streaming action owns its own
// MiniTerminalLine state and passes it in here.
export default function MiniTerminal({ line, idleLabel = "Ready" }: MiniTerminalProps) {
  const color = !line
    ? "text-gray-700"
    : line.status === "error"
    ? "text-red-400"
    : line.status === "done"
    ? "text-[#9a9a9a]"
    : "text-[#f4f0e8]";

  return (
    <div className="w-full flex items-center gap-2.5 border border-[#1c1c1c] bg-[#0a0a0a] rounded-lg px-3 py-2 font-mono text-[11px] overflow-hidden">
      <div className="flex items-center gap-1 flex-none">
        {DOT_COLORS.map((dotColor) => (
          <span key={dotColor} className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
        ))}
      </div>
      <span className="text-[var(--gold-primary)] flex-none">$</span>
      <span className={`truncate ${color}`}>{line ? line.text : idleLabel}</span>
      {line?.status === "active" && (
        <span className="inline-block w-1.5 h-3 flex-none bg-[var(--gold-primary)] animate-pulse" />
      )}
    </div>
  );
}
