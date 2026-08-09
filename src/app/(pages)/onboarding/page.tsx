"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

import Logo from "@/components/common/Logo";
import WelcomeScreen from "@/components/onboarding/WelcomeScreen";
import ProgressBar from "@/components/onboarding/ProgressBar";
import QuestionStep from "@/components/onboarding/QuestionStep";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { useGetCurrentSessionQuery, setUser } from "@/redux/services/auth/auth";
import { ONBOARDING_ANSWERS_STORAGE_KEY } from "@/constants/onboarding";
// Onboarding submit API is temporarily disabled — the product flow changed and
// a new integration will be wired up later. Service file is kept as-is for reuse.
// import { useSubmitOnboardingAnswerMutation } from "@/redux/services/onboarding/onboarding";

// ─── Option datasets ──────────────────────────────────────────────────────────

const BUSINESS_TYPE_OPTIONS = [
  { value: "ecommerce", label: "E-commerce & retail", description: "Products, stores, DTC brands" },
  { value: "saas", label: "SaaS / tech product", description: "Apps, platforms, dev tools" },
  { value: "agency", label: "Agency or freelance", description: "Services, clients, creative work" },
  { value: "creator", label: "Creator or personal brand", description: "Content, community, influence" },
  { value: "local", label: "Local business", description: "Brick-and-mortar, services" },
  { value: "other", label: "Something else", description: "I'll tell you more later" },
];

const CHALLENGE_OPTIONS = [
  { value: "content", label: "Creating enough content", description: "Ads, posts, UGC, copy — never enough hours" },
  { value: "leads", label: "Finding and converting leads", description: "Traffic, outreach, and turning visitors into buyers" },
  { value: "ops", label: "Manual, repetitive work", description: "Tasks that eat my week but shouldn't" },
  { value: "scale", label: "Scaling without hiring", description: "Do more with the team I already have" },
];

const TEAM_SIZE_OPTIONS = [
  { value: "solo", label: "Just me" },
  { value: "small", label: "2–10 people" },
  { value: "medium", label: "11+ people" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  size?: "normal" | "large";
}

interface StepConfig {
  id: string;
  type: "options" | "website";
  question: string;
  subtitle?: string;
  options?: StepOption[];
  multi?: boolean;
  columns?: 1 | 2 | 3;
  field: "businessType" | "challenge" | "teamSize" | "website";
}

interface OnboardingAnswers {
  businessType: string;
  challenge: string;
  teamSize: string;
  website: string;
}

// ─── Step configs ─────────────────────────────────────────────────────────────

const STEPS: StepConfig[] = [
  {
    id: "businessType",
    type: "options",
    question: "What kind of business are you building?",
    subtitle: "We'll personalize your workspace around your world.",
    options: BUSINESS_TYPE_OPTIONS,
    multi: false,
    columns: 2,
    field: "businessType",
  },
  {
    id: "challenge",
    type: "options",
    question: "What's your biggest challenge right now?",
    subtitle: "Pick the one that's costing you the most time or money.",
    options: CHALLENGE_OPTIONS,
    multi: false,
    columns: 2,
    field: "challenge",
  },
  {
    id: "teamSize",
    type: "options",
    question: "How big is your team?",
    subtitle: "Helps us suggest the right mix of apps and agents.",
    options: TEAM_SIZE_OPTIONS,
    multi: false,
    columns: 1,
    field: "teamSize",
  },
  {
    id: "website",
    type: "website",
    question: "Your website (optional)",
    subtitle: "Drop your URL and we'll analyze your site and pre-fill your project.",
    field: "website",
  },
];

// ─── Page component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { isLoading: sessionLoading } = useGetCurrentSessionQuery();
  // const [submitAnswer, { isLoading: isSubmitting }] = useSubmitOnboardingAnswerMutation();
  const isSubmitting = false;

  const [screen, setScreen] = useState<"welcome" | "questions">("welcome");
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    businessType: "",
    challenge: "",
    teamSize: "",
    website: "",
  });

  // Derived values
  const steps: StepConfig[] = STEPS;
  const totalSteps = steps.length;
  const stepConfig = steps[currentStep];

  const getCurrentValue = (): string => {
    if (!stepConfig) return "";
    return answers[stepConfig.field];
  };

  const canProceed = (): boolean => {
    // Website is optional, but only via the explicit "Skip" link — the
    // Finish/Next button still requires a value like every other step.
    const val = getCurrentValue();
    return typeof val === "string" && val.trim() !== "";
  };

  const transition = (action: () => void) => {
    setVisible(false);
    setTimeout(() => {
      action();
      setVisible(true);
    }, 180);
  };

  const handleSelect = (value: string) => {
    const field = stepConfig.field;
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = (overrideAnswer?: string) => {
    // API submission is temporarily disabled — see the commented-out
    // useSubmitOnboardingAnswerMutation import above. Steps advance locally only.
    const field = stepConfig.field;
    const finalAnswers = overrideAnswer !== undefined ? { ...answers, [field]: overrideAnswer } : answers;
    if (overrideAnswer !== undefined) {
      setAnswers(finalAnswers);
    }

    // Move to next step or complete
    if (currentStep < totalSteps - 1) {
      transition(() => setCurrentStep((s) => s + 1));
    } else {
      // Update Redux state to mark onboarding as completed
      if (user) {
        dispatch(
          setUser({
            ...user,
            onboardingStatus: false,
          })
        );
      }

      sessionStorage.setItem(
        ONBOARDING_ANSWERS_STORAGE_KEY,
        JSON.stringify({
          businessType: finalAnswers.businessType || undefined,
          challenge: finalAnswers.challenge || undefined,
          teamSize: finalAnswers.teamSize || undefined,
          websiteUrl: finalAnswers.website || undefined,
        })
      );
      router.push("/auth/signup");
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      transition(() => setScreen("welcome"));
    } else {
      transition(() => setCurrentStep((s) => s - 1));
    }
  };

  const handleSkip = () => {
    // Update Redux state to mark onboarding as completed
    if (user) {
      dispatch(
        setUser({
          ...user,
          onboardingStatus: false,
        })
      );
    }
    router.push("/dashboard");
  };

  // Loading state while session is fetched on refresh
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[var(--gold-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden relative flex flex-col">
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 flex-shrink-0">
        <Link href="/">
          <Logo size="sm" />
        </Link>
        {screen === "questions" && currentStep > 0 && (
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors duration-200 flex items-center gap-1"
          >
            Skip for now
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Main content — fills remaining height, no page scroll */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-3 overflow-hidden">
        <div className="w-full max-w-2xl">
          {/* Welcome screen */}
          {screen === "welcome" && (
            <div className="bg-[#1a1a1a]/60 backdrop-blur-xl rounded-2xl border border-white/10">
              <WelcomeScreen
                onStart={() => transition(() => setScreen("questions"))}
              />
            </div>
          )}

          {/* Questions screen */}
          {screen === "questions" && stepConfig && (
            <div
              className={`bg-[#1a1a1a]/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sm:p-8 transition-opacity duration-200 ${
                visible ? "opacity-100" : "opacity-0"
              }`}
            >
              {/* Progress bar */}
              <div className="mb-5">
                <ProgressBar current={currentStep} total={totalSteps} />
              </div>

              {/* Question + options */}
              {stepConfig.type === "website" ? (
                <div className="animate-fadeIn">
                  <div className="mb-4 sm:mb-5">
                    <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                      {stepConfig.question}
                    </h2>
                    {stepConfig.subtitle && (
                      <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                        {stepConfig.subtitle}
                      </p>
                    )}
                  </div>

                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://yourwebsite.com"
                    value={answers.website}
                    onChange={(e) => handleSelect(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[var(--gold-primary)] transition-colors duration-200"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      handleSelect("");
                      handleNext("");
                    }}
                    className="mt-3 text-[var(--gold-primary)] hover:text-[var(--gold-light)] text-sm font-medium transition-colors duration-200"
                  >
                    Skip — I&apos;ll add it later
                  </button>
                </div>
              ) : (
                <QuestionStep
                  question={stepConfig.question}
                  subtitle={stepConfig.subtitle}
                  options={stepConfig.options ?? []}
                  selected={getCurrentValue()}
                  onSelect={handleSelect}
                  multi={stepConfig.multi}
                  columns={stepConfig.columns}
                />
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>

                <button
                  onClick={() => handleNext()}
                  disabled={!canProceed() || isSubmitting}
                  className={`flex items-center gap-2 px-7 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    canProceed() && !isSubmitting
                      ? "animate-button-gradient text-black hover:shadow-lg hover:shadow-[var(--gold-primary)]/20 hover:scale-[1.02]"
                      : "bg-white/5 text-gray-600 cursor-not-allowed border border-white/10"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-gray-600 border-t-gray-400 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {currentStep === totalSteps - 1 ? "Finish" : "Next"}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
