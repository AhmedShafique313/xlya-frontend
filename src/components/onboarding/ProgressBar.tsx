interface ProgressBarProps {
  current: number; // 0-based current step index
  total: number;   // total number of steps
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = Math.round(((current + 1) / total) * 100);

  return (
    <div className="w-full">
      {/* Step segments */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-500 flex-1 ${
              i < current
                ? "bg-gradient-to-r from-[var(--gold-secondary)] to-[var(--gold-primary)]"
                : i === current
                ? "bg-[var(--gold-primary)]/50"
                : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* Labels */}
      <div className="flex justify-between items-center mt-1.5">
        <span className="text-gray-500 text-xs">
          Step {current + 1} of {total}
        </span>
        <span className="text-[var(--gold-primary)] text-xs font-medium">
          {percentage}% complete
        </span>
      </div>
    </div>
  );
}
