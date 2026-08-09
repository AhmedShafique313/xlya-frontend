"use client";

import { motion, AnimatePresence } from "framer-motion";

export interface LoadingStep {
  id: string;
  label: string;
  // "failed" = this sub-task couldn't complete but the overall signup kept
  // going (e.g. a rate-limited enrichment call) — shown, not treated as fatal.
  status: "active" | "completed" | "failed";
}

interface LoadingScreenProps {
  /** The single step currently being shown — only one is ever rendered at
   *  a time so the card stays a fixed height no matter how many steps the
   *  backend reports (can be a dozen+ when a website URL is analyzed). */
  currentStep: LoadingStep | null;
  activity?: string;
  /** 0–100, how far through the known signup+onboarding steps we are */
  progress: number;
}

const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function LoadingScreen({ currentStep, activity, progress }: LoadingScreenProps) {
  const clampedProgress = Math.round(Math.min(Math.max(progress, 0), 100));
  const strokeDashoffset = CIRCUMFERENCE * (1 - clampedProgress / 100);

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 sm:px-10 lg:px-16 py-8 sm:py-10 animate-fadeIn">
      {/* Circular progress ring */}
      <div className="relative mb-8 h-44 w-44">
        <svg width="100%" height="100%" viewBox="0 0 200 200" role="img" aria-label={`Progress: ${clampedProgress}%`}>
          <g transform="rotate(-90, 100, 100)">
            <circle cx="100" cy="100" r={RADIUS} fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
            <motion.circle
              cx="100"
              cy="100"
              r={RADIUS}
              fill="transparent"
              stroke="var(--gold-primary)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{clampedProgress}%</span>
          <div className="w-9 h-9 rounded-full bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/20 flex items-center justify-center mt-1.5">
            <svg className="w-4 h-4 text-[var(--gold-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <p className="text-gray-500 text-sm mb-8 min-h-[1.25rem]">
        {activity || "Hang tight, we're setting things up for you"}
      </p>

      {/* Single current-step indicator — fixed height, swaps via animation
          instead of stacking every step (there can be a dozen+). */}
      <div className="w-full max-w-xs h-14 flex items-center">
        <AnimatePresence mode="wait">
          {currentStep && (
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex items-center gap-3 w-full"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  currentStep.status === "completed"
                    ? "bg-[var(--gold-primary)] shadow-md shadow-[var(--gold-primary)]/30"
                    : currentStep.status === "failed"
                    ? "bg-amber-500/15 border border-amber-500/40"
                    : "bg-white/5 border border-white/20"
                }`}
              >
                {currentStep.status === "completed" ? (
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : currentStep.status === "failed" ? (
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--gold-primary)] animate-pulse" />
                )}
              </div>
              <span
                className={`text-sm font-medium text-left ${
                  currentStep.status === "failed" ? "text-amber-300/90" : "text-white"
                }`}
              >
                {currentStep.label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
