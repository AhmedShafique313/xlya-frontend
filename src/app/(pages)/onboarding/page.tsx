"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import Logo from "@/assets/images/Logo4.png";
import AnimatedXBackground from "@/components/common/AnimatedXBackground";
import WelcomeScreen from "@/components/onboarding/WelcomeScreen";
import ProgressBar from "@/components/onboarding/ProgressBar";
import QuestionStep from "@/components/onboarding/QuestionStep";
import LoadingScreen from "@/components/onboarding/LoadingScreen";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { useGetCurrentSessionQuery, setUser } from "@/redux/services/auth/auth";
import { useSubmitOnboardingAnswerMutation } from "@/redux/services/onboarding/onboarding";
import { toast } from "@/components/snakbar";

// ─── Option datasets ──────────────────────────────────────────────────────────

const USER_TYPE_OPTIONS = [
  {
    label: "Solo / Individual",
    description: "Just me, exploring and building on my own",
    size: "large" as const,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ) as ReactNode,
  },
  {
    label: "Team / Organization",
    description: "Working with a team or company",
    size: "large" as const,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ) as ReactNode,
  },
];

const ROLE_OPTIONS = [
  { label: "Marketing / Growth" },
  { label: "Developer / Engineer" },
  { label: "Founder / Co-founder" },
  { label: "Product Manager" },
  { label: "Sales" },
  { label: "Other" },
];

const INDUSTRY_OPTIONS = [
  { label: "Education" },
  { label: "Agency / Startups" },
  { label: "SaaS / Tech" },
  { label: "Healthcare" },
  { label: "E-Commerce" },
];

const GOALS_OPTIONS = [
  { label: "AI" },
  { label: "Fabric Generation" },
  { label: "Manage Team" },
  { label: "SMART Scheduler" },
  { label: "CRM" },
  { label: "Autonomous Campaigns" },
  { label: "Explore Xlya Capabilities" },
];

const TEAM_SIZE_OPTIONS = [
  { label: "2–10" },
  { label: "21–50" },
  { label: "50–100" },
  { label: "101–200" },
  { label: "200+" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepOption {
  label: string;
  description?: string;
  icon?: ReactNode;
  size?: "normal" | "large";
}

interface StepConfig {
  id: string;
  question: string;
  subtitle?: string;
  options: StepOption[];
  multi: boolean;
  columns: 1 | 2 | 3;
  field: "userType" | "teamSize" | "role" | "industry" | "goals";
}

interface OnboardingAnswers {
  userType: string;
  teamSize: string;
  role: string;
  industry: string;
  goals: string[];
}

// ─── Step configs ─────────────────────────────────────────────────────────────

const STEP_USER_TYPE: StepConfig = {
  id: "userType",
  question: "How do you plan to use Xlya?",
  options: USER_TYPE_OPTIONS,
  multi: false,
  columns: 2,
  field: "userType",
};

const STEP_TEAM_SIZE: StepConfig = {
  id: "teamSize",
  question: "How big is your team?",
  options: TEAM_SIZE_OPTIONS,
  multi: false,
  columns: 2,
  field: "teamSize",
};

const STEP_ROLE: StepConfig = {
  id: "role",
  question: "What best describes your role?",
  options: ROLE_OPTIONS,
  multi: false,
  columns: 2,
  field: "role",
};

const STEP_INDUSTRY: StepConfig = {
  id: "industry",
  question: "Which industry do you work in?",
  options: INDUSTRY_OPTIONS,
  multi: false,
  columns: 2,
  field: "industry",
};

const STEP_GOALS: StepConfig = {
  id: "goals",
  question: "What do you want to achieve with Xlya right now?",
  subtitle: "This helps us highlight the most relevant features for you.",
  options: GOALS_OPTIONS,
  multi: true,
  columns: 3,
  field: "goals",
};

const SOLO_STEPS: StepConfig[] = [STEP_USER_TYPE, STEP_ROLE, STEP_INDUSTRY, STEP_GOALS];
const TEAM_STEPS: StepConfig[] = [STEP_USER_TYPE, STEP_TEAM_SIZE, STEP_ROLE, STEP_INDUSTRY, STEP_GOALS];

// ─── Page component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { isLoading: sessionLoading } = useGetCurrentSessionQuery();
  const [submitAnswer, { isLoading: isSubmitting }] = useSubmitOnboardingAnswerMutation();

  const [screen, setScreen] = useState<"welcome" | "questions" | "loading">("welcome");
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    userType: "",
    teamSize: "",
    role: "",
    industry: "",
    goals: [],
  });

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [sessionLoading, isAuthenticated, router]);

  // Skip onboarding if already completed (onboarding_status === false means completed)
  // Guard against firing during the loading screen animation at the end of onboarding
  useEffect(() => {
    if (user?.onboardingStatus === false && screen !== "loading") {
      router.push("/dashboard");
    }
  }, [user, router, screen]);

  // Derived values
  const isTeam = answers.userType === "Team / Organization";
  const steps: StepConfig[] = isTeam ? TEAM_STEPS : SOLO_STEPS;
  const totalSteps = steps.length;
  const stepConfig = steps[currentStep];

  const getCurrentValue = (): string | string[] => {
    if (!stepConfig) return "";
    return answers[stepConfig.field];
  };

  const canProceed = (): boolean => {
    const val = getCurrentValue();
    if (stepConfig?.multi) return Array.isArray(val) && val.length > 0;
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
    if (stepConfig.multi) {
      setAnswers((prev) => {
        const arr = prev[field] as string[];
        return {
          ...prev,
          [field]: arr.includes(value)
            ? arr.filter((v) => v !== value)
            : [...arr, value],
        };
      });
    } else {
      setAnswers((prev) => {
        // Reset dependent answers when user type changes
        if (field === "userType" && prev[field] !== value) {
          return { ...prev, userType: value, teamSize: "", role: "", industry: "", goals: [] };
        }
        return { ...prev, [field]: value };
      });
    }
  };

  const handleNext = async () => {
    try {
      // Map current step to question_id and prepare answer
      let questionId = "";
      let answer = "";

      const field = stepConfig.field;
      const value = answers[field];

      if (field === "userType") {
        // First question (q1) - mandatory onboarding question
        questionId = "q1";
        answer = value === "Solo / Individual" ? "individual" : "team";
      } else if (field === "goals") {
        // Goals are multi-select, join with commas
        answer = Array.isArray(value) ? value.join(", ") : "";
        // Determine question_id based on user type
        questionId = isTeam ? "q4" : "q4";
      } else {
        // Other questions (role, industry, teamSize)
        answer = typeof value === "string" ? value : "";

        // Map to question_id based on user type and step
        if (isTeam) {
          if (field === "teamSize") questionId = "q2";
          else if (field === "role") questionId = "q3";
          else if (field === "industry") questionId = "q4";
        } else {
          if (field === "role") questionId = "q2";
          else if (field === "industry") questionId = "q3";
        }
      }

      // Submit answer to API
      const response = await submitAnswer({
        answer,
        question_id: questionId === "q1" ? undefined : questionId,
      }).unwrap();

      console.log("Onboarding response:", response);

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
              userType: response.user_type || user.userType,
            })
          );
        }

        setScreen("loading");
        setTimeout(() => {
          toast.success("Onboarding completed successfully!");
          router.push("/dashboard");
        }, 3800);
      }
    } catch (error: any) {
      console.error("Error submitting onboarding answer:", error);
      toast.error(error?.data?.message || "Failed to save your answer. Please try again.");
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[var(--gold-primary)] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="h-screen overflow-hidden bg-black relative flex flex-col">
      {/* Fixed background */}
      <AnimatedXBackground />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 flex-shrink-0">
        <Link href="/">
          <Image src={Logo} alt="Xlya" width={90} height={30} className="h-auto w-auto" />
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
              <QuestionStep
                question={stepConfig.question}
                subtitle={stepConfig.subtitle}
                options={stepConfig.options}
                selected={getCurrentValue()}
                onSelect={handleSelect}
                multi={stepConfig.multi}
                columns={stepConfig.columns}
              />

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
                  onClick={handleNext}
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

          {/* Loading screen */}
          {screen === "loading" && (
            <div className="bg-[#1a1a1a]/60 backdrop-blur-xl rounded-2xl border border-white/10">
              <LoadingScreen />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
