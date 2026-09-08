"use client";

import { useLandingTheme } from "@/components/landingPage/landingTheme";

interface ProgressBarProps {
  current: number; // 0-based current step index
  total: number;   // total number of steps
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const { t } = useLandingTheme();
  const percentage = Math.round(((current + 1) / total) * 100);

  return (
    <div className="w-full">
      {/* Step segments */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className="h-1 rounded-full flex-1"
            style={{
              background: i < current ? t.gold : i === current ? `${t.gold}80` : t.barInactive,
              transition: "background 0.5s",
            }}
          />
        ))}
      </div>

      {/* Labels */}
      <div className="flex justify-between items-center mt-1.5">
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: t.fgFaint }}>
          Step {current + 1} of {total}
        </span>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500, color: t.gold }}>
          {percentage}% complete
        </span>
      </div>
    </div>
  );
}
