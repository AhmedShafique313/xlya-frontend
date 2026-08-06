"use client";

import { useState, useEffect } from "react";

const CHECKLIST_ITEMS = [
  "Personalizing insights",
  "Adapting to your goals",
  "Preparing recommendations",
];

export default function LoadingScreen() {
  const [checkedSet, setCheckedSet] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timers = CHECKLIST_ITEMS.map((_, i) =>
      setTimeout(
        () => setCheckedSet((prev) => new Set([...prev, i])),
        900 + i * 1000
      )
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 sm:px-10 lg:px-16 py-8 sm:py-10 animate-fadeIn">
      {/* Spinner */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full border-[3px] border-white/10 border-t-[var(--gold-primary)] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-[var(--gold-primary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
        Xlya is customizing your workspace…
      </h2>
      <p className="text-gray-500 text-sm mb-10">
        Hang tight, we&apos;re setting things up for you
      </p>

      {/* Animated checklist */}
      <div className="space-y-4 w-full max-w-xs text-left">
        {CHECKLIST_ITEMS.map((item, i) => {
          const isChecked = checkedSet.has(i);
          return (
            <div
              key={item}
              className={`flex items-center gap-3 transition-all duration-500 ${
                isChecked ? "opacity-100" : "opacity-30"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                  isChecked
                    ? "bg-[var(--gold-primary)] shadow-md shadow-[var(--gold-primary)]/30"
                    : "bg-white/5 border border-white/20"
                }`}
              >
                {isChecked && (
                  <svg
                    className="w-3.5 h-3.5 text-black"
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
                )}
              </div>
              <span
                className={`text-sm font-medium transition-colors duration-500 ${
                  isChecked ? "text-white" : "text-gray-600"
                }`}
              >
                {item}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
