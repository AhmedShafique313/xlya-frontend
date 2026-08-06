import type { ReactNode } from "react";

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
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full h-full text-left rounded-xl border transition-all duration-200 group flex flex-col justify-center ${
        size === "large" ? "p-4 min-h-[76px]" : "p-3 min-h-[60px]"
      } ${
        selected
          ? "border-[var(--gold-primary)] bg-[var(--gold-primary)]/10 shadow-lg shadow-[var(--gold-primary)]/10"
          : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
      }`}
    >
      {/* Check indicator */}
      {selected && (
        <div className="absolute top-2.5 right-2.5">
          <div className="w-5 h-5 rounded-full bg-[var(--gold-primary)] flex items-center justify-center">
            <svg
              className="w-3 h-3 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Icon */}
      {icon && (
        <div
          className={`mb-2.5 transition-colors ${
            selected
              ? "text-[var(--gold-primary)]"
              : "text-gray-400 group-hover:text-gray-300"
          }`}
        >
          {icon}
        </div>
      )}

      {/* Label */}
      <p
        className={`font-semibold transition-colors leading-snug ${
          size === "large" ? "text-sm sm:text-base" : "text-sm"
        } ${selected ? "text-[var(--gold-primary)]" : "text-white"}`}
      >
        {label}
      </p>

      {/* Description */}
      {description && (
        <p
          className={`mt-1 text-xs leading-relaxed ${
            selected ? "text-[var(--gold-primary)]/70" : "text-gray-500"
          }`}
        >
          {description}
        </p>
      )}
    </button>
  );
}
