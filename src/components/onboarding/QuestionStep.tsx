"use client";

import type { ReactNode } from "react";
import OptionCard from "./OptionCard";
import { useLandingTheme } from "@/components/landingPage/landingTheme";

interface Option {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  size?: "normal" | "large";
}

interface QuestionStepProps {
  question: string;
  subtitle?: string;
  options: Option[];
  selected: string | string[];
  onSelect: (value: string) => void;
  multi?: boolean;
  columns?: 1 | 2 | 3;
}

export default function QuestionStep({
  question,
  subtitle,
  options,
  selected,
  onSelect,
  multi = false,
  columns = 2,
}: QuestionStepProps) {
  const { t } = useLandingTheme();

  const gridColsMap: Record<1 | 2 | 3, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
  };

  const isSelected = (value: string): boolean => {
    if (multi && Array.isArray(selected)) return selected.includes(value);
    return selected === value;
  };

  // Detect a single orphan in the last row of a 3-column grid.
  // When there is exactly 1 item left over, center it using col-start-2 on sm+.
  const isOrphan = (index: number): boolean =>
    columns === 3 && options.length % 3 === 1 && index === options.length - 1;

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-4 sm:mb-5">
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(20px, 3vw, 28px)",
            letterSpacing: "-0.01em",
            lineHeight: 1.25,
            color: t.fg,
            margin: 0,
          }}
        >
          {question}
        </h2>
        {subtitle && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: t.fgMid, marginTop: 8, lineHeight: 1.6 }}>
            {subtitle}
          </p>
        )}
        {multi && (
          <div className="flex items-center gap-1.5 mt-2">
            <svg
              className="w-3.5 h-3.5 flex-shrink-0"
              style={{ color: t.gold }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: t.gold }}>
              Select all that apply
            </span>
          </div>
        )}
      </div>

      {/* Options Grid */}
      <div className={`grid ${gridColsMap[columns]} gap-2.5`}>
        {options.map((opt, index) => (
          <div
            key={opt.label}
            className={`flex flex-col${isOrphan(index) ? " sm:col-start-2" : ""}`}
          >
            <OptionCard
              label={opt.label}
              description={opt.description}
              icon={opt.icon}
              selected={isSelected(opt.value)}
              onClick={() => onSelect(opt.value)}
              size={opt.size}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
