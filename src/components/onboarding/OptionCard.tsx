"use client";

import type { ReactNode } from "react";
import { useLandingTheme } from "@/components/landingPage/landingTheme";

interface OptionCardProps {
  label: string;
  description?: string;
  icon?: ReactNode;
  selected: boolean;
  onClick: () => void;
  size?: "normal" | "large";
}

export default function OptionCard({
  label,
  description,
  icon,
  selected,
  onClick,
  size = "normal",
}: OptionCardProps) {
  const { t } = useLandingTheme();
  // Checkmark needs to contrast against the gold badge behind it in both themes.
  const checkColor = t.isDark ? "#0a0a0a" : "#faf8f4";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full h-full text-left rounded-xl transition-all duration-200 hover:-translate-y-0.5 group flex flex-col justify-center ${
        size === "large" ? "p-4 min-h-[76px]" : "p-3 min-h-[60px]"
      }`}
      style={{
        border: `1px solid ${selected ? t.gold : t.border}`,
        background: selected ? t.goldDim : t.surface,
      }}
    >
      {/* Check indicator */}
      {selected && (
        <div className="absolute top-2.5 right-2.5">
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: t.gold }}>
            <svg className="w-3 h-3" style={{ color: checkColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Icon */}
      {icon && (
        <div className="mb-2.5 transition-colors" style={{ color: selected ? t.gold : t.fgMid }}>
          {icon}
        </div>
      )}

      {/* Label */}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 500,
          lineHeight: 1.4,
          fontSize: size === "large" ? 15 : 14,
          color: selected ? t.gold : t.fg,
        }}
      >
        {label}
      </p>

      {/* Description */}
      {description && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            lineHeight: 1.5,
            marginTop: 4,
            color: selected ? t.gold : t.fgDim,
            opacity: selected ? 0.85 : 1,
          }}
        >
          {description}
        </p>
      )}
    </button>
  );
}
