"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/common/Logo";
import AuthFeaturesSidebar from "@/components/auth/AuthFeaturesSidebar";
import LoadingScreen, { LoadingStep } from "@/components/onboarding/LoadingScreen";
import { useAppDispatch } from "@/redux/hooks";
import { setCredentials, setUser, setProject } from "@/redux/services/auth/auth";
import { streamSignup, SignupApiError } from "@/lib/api/signupStream";
import { getJwtExpiryMs } from "@/utils/jwt";
import { ONBOARDING_ANSWERS_STORAGE_KEY, StoredOnboardingAnswers } from "@/constants/onboarding";
import { toast } from "@/components/snakbar";

const GENDER_SLUGS: Record<string, string> = {
  Male: "male",
  Female: "female",
  "Prefer not to say": "prefer_not_to_say",
};

// The combined signup+onboarding API's known top-level step sequence, used
// only to drive the progress ring — extra/unexpected steps are ignored.
// The website-analysis leg only runs when a websiteUrl was submitted.
const BASE_STEP_IDS = [
  "validation",
  "create_account",
  "confirm_account",
  "authenticate",
  "save_onboarding",
  "create_project",
];
const WEBSITE_STEP_IDS = [
  "fetch_website_html",
  "parse_website_html",
  "compute_lighthouse_metrics",
  "generate_icp_competitors",
  "save_website_analysis",
];

// Steps arrive in a single fast burst (the backend can't truly stream them
// to the browser through this API — see signupStream.ts), so revealing them
// all at once feels instant and the checklist would grow tall with the
// website-analysis leg's extra steps. Instead we pace a single-step display
// through a fixed-ish total duration, independent of real arrival speed.
const TARGET_REVEAL_DURATION_MS = 7000;
const MIN_STEP_REVEAL_MS = 500;
const MAX_STEP_REVEAL_MS = 1300;

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [activity, setActivity] = useState("");
  const [expectedStepIds, setExpectedStepIds] = useState<string[]>(BASE_STEP_IDS);

  // Authoritative, always-fresh list of top-level steps received so far —
  // a ref so the streaming callback (a closure that outlives re-renders)
  // never reads a stale value. dataVersion just exists to force a re-render
  // / re-check of the reveal effect whenever the ref changes, since ref
  // mutations alone don't trigger one.
  const stepsRef = useRef<LoadingStep[]>([]);
  const [dataVersion, setDataVersion] = useState(0);
  // How many of stepsRef's entries are currently "revealed" to the user;
  // a timer advances this at a paced cadence, independent of when the
  // underlying data actually arrived.
  const [revealedCount, setRevealedCount] = useState(0);

  const currentStep = revealedCount > 0 ? stepsRef.current[revealedCount - 1] ?? null : null;
  const progress = (revealedCount / expectedStepIds.length) * 100;

  useEffect(() => {
    if (!showLoading) return;
    if (revealedCount >= stepsRef.current.length) return; // nothing new yet — wait for more data
    if (revealedCount >= expectedStepIds.length) return; // already fully revealed

    const perStepMs = Math.min(
      MAX_STEP_REVEAL_MS,
      Math.max(MIN_STEP_REVEAL_MS, TARGET_REVEAL_DURATION_MS / expectedStepIds.length)
    );
    const timer = setTimeout(() => setRevealedCount((c) => c + 1), perStepMs);
    return () => clearTimeout(timer);
  }, [showLoading, revealedCount, expectedStepIds.length, dataVersion]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);

  const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: "" }));
    }
  };

  const handleGenderSelect = (value: string) => {
    setFormData((prev) => ({ ...prev, gender: value }));
    if (errors.gender) {
      setErrors((prev: any) => ({ ...prev, gender: "" }));
    }
    setGenderOpen(false);
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.gender) {
      newErrors.gender = "Please select an option";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const storedRaw = sessionStorage.getItem(ONBOARDING_ANSWERS_STORAGE_KEY);
    const onboardingAnswers: StoredOnboardingAnswers = storedRaw ? JSON.parse(storedRaw) : {};

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      gender: GENDER_SLUGS[formData.gender] ?? formData.gender.toLowerCase(),
      email: formData.email,
      password: formData.password,
      ...(onboardingAnswers.businessType && { businessType: onboardingAnswers.businessType }),
      ...(onboardingAnswers.challenge && { challenge: onboardingAnswers.challenge }),
      ...(onboardingAnswers.teamSize && { teamSize: onboardingAnswers.teamSize }),
      ...(onboardingAnswers.websiteUrl && { websiteUrl: onboardingAnswers.websiteUrl }),
    };

    setIsSigningUp(true);
    setShowLoading(true);
    stepsRef.current = [];
    setRevealedCount(0);
    setDataVersion((v) => v + 1);
    setActivity("Getting things started…");
    setExpectedStepIds(payload.websiteUrl ? [...BASE_STEP_IDS, ...WEBSITE_STEP_IDS] : BASE_STEP_IDS);

    try {
      await streamSignup(payload, (event) => {
        if (event.type === "step") {
          // Live detail text updates immediately for every step, including
          // nested sub-steps ("Naming your project") — only top-level steps
          // additionally get a row in the paced single-step reveal below.
          setActivity(event.label);

          if (event.parent === null) {
            const status =
              event.status === "completed" ? "completed" : event.status === "failed" ? "failed" : "active";
            const idx = stepsRef.current.findIndex((s) => s.id === event.step);
            if (idx === -1) {
              stepsRef.current = [...stepsRef.current, { id: event.step, label: event.label, status }];
            } else {
              const next = [...stepsRef.current];
              next[idx] = { id: event.step, label: event.label, status };
              stepsRef.current = next;
            }
            setDataVersion((v) => v + 1);
          }
          return;
        }

        // Final "result" event — the real source of truth for success/failure.
        // Error responses use "error" instead of "message" and omit tokens/sub;
        // validation errors additionally carry "details" with the specific
        // field message(s), which are more useful than the generic "error".
        if (event.statusCode !== 200 || !event.tokens || !event.sub) {
          const message = event.details?.length
            ? event.details.join(" ")
            : event.error || event.message || "Signup failed";
          throw new SignupApiError(message, event.statusCode);
        }

        // Only the access token is kept — id/refresh tokens aren't used anywhere in the app
        dispatch(
          setCredentials({
            user: {
              email: formData.email,
              userId: event.sub,
              firstName: formData.firstName,
              lastName: formData.lastName,
            },
            tokens: {
              accessToken: event.tokens.accessToken,
              expiresAt: getJwtExpiryMs(event.tokens.accessToken),
            },
          })
        );
        dispatch(
          setUser({
            email: formData.email,
            userId: event.sub,
            firstName: formData.firstName,
            lastName: formData.lastName,
            onboardingStatus: false,
            gender: payload.gender,
            projectId: event.project?.project_id,
          })
        );
        dispatch(setProject(event.project ?? null));

        sessionStorage.removeItem(ONBOARDING_ANSWERS_STORAGE_KEY);
        // We already have the real outcome — don't make the user sit through
        // the rest of the paced reveal, snap straight to the finished state.
        stepsRef.current = stepsRef.current.map((s) => ({ ...s, status: "completed" as const }));
        setRevealedCount(stepsRef.current.length);
        setActivity("All set!");

        setTimeout(() => {
          toast.success("Onboarding completed successfully!");
          router.push("/dashboard");
        }, 900);
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      setShowLoading(false);

      const errorMessage = error?.message || "An error occurred";
      const isDuplicateEmail =
        error instanceof SignupApiError
          ? error.statusCode === 409
          : errorMessage.toLowerCase().includes("already exists");

      if (isDuplicateEmail) {
        setErrors({ email: "An account with this email already exists" });
        toast.error(
          <span>
            An account with this email already exists.{" "}
            <Link href="/auth/login" className="underline text-[var(--gold-primary)]">
              Log in instead
            </Link>
          </span>
        );
      } else if (errorMessage.toLowerCase().includes("password")) {
        setErrors({
          password: "Password must contain uppercase, lowercase, numbers, and special characters"
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignup = () => {
    console.log("Google signup");
    // TODO: Implement Google OAuth with Cognito
  };

  const handleGithubSignup = () => {
    console.log("GitHub signup");
    // TODO: Implement GitHub OAuth with Cognito
  };

  const handleSlackSignup = () => {
    console.log("Slack signup");
    // TODO: Implement Slack OAuth with Cognito
  };

  if (showLoading) {
    return (
      <div className="min-h-screen h-screen flex items-center justify-center relative overflow-hidden">
        <div className="relative z-10 w-full max-w-md bg-[#1a1a1a]/60 backdrop-blur-xl rounded-2xl border border-white/10">
          <LoadingScreen currentStep={currentStep} activity={activity} progress={progress} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen flex relative overflow-hidden">
      {/* Left Side - Features */}
      <AuthFeaturesSidebar />

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-9 relative z-10">
        <div className="w-full max-w-md bg-[#1a1a1a]/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 my-6">
          {/* Logo for mobile */}
          <div className="lg:hidden mb-4 text-center">
            <Link href="/">
              <Logo size="sm" className="mx-auto" />
            </Link>
          </div>

          {/* Social Sign Up Buttons */}
          <div className="mb-4">
            <p className="text-gray-400 text-[0.78rem] mb-2">Register with:</p>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={handleGoogleSignup}
                className="bg-[#2a2a2a]/50 backdrop-blur-sm border border-gray-700/50 text-white py-2.5 rounded-lg hover:bg-[#2a2a2a] transition-all duration-300 flex items-center justify-center"
              >
                <svg className="w-[1.05rem] h-[1.05rem]" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </button>
              <button
                onClick={handleGithubSignup}
                className="bg-[#2a2a2a]/50 backdrop-blur-sm border border-gray-700/50 text-white py-2.5 rounded-lg hover:bg-[#2a2a2a] transition-all duration-300 flex items-center justify-center"
              >
                <svg className="w-[1.05rem] h-[1.05rem]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </button>
              <button
                onClick={handleSlackSignup}
                className="bg-[#2a2a2a]/50 backdrop-blur-sm border border-gray-700/50 text-white py-2.5 rounded-lg hover:bg-[#2a2a2a] transition-all duration-300 flex items-center justify-center"
              >
                <svg className="w-[1.05rem] h-[1.05rem]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-700"></div>
            <span className="text-gray-500 text-[0.78rem] font-medium">Or</span>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[0.78rem] font-medium text-gray-300 mb-1.5">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none z-10">
                    <svg className="w-[0.9rem] h-[0.9rem] text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full pl-9 pr-2.5 py-2.5 text-[0.78rem] bg-[#2a2a2a]/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] transition-all"
                    placeholder="First Name"
                  />
                </div>
                {errors.firstName && (
                  <p className="text-red-400 text-[0.72rem] mt-1">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-[0.78rem] font-medium text-gray-300 mb-1.5">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none z-10">
                    <svg className="w-[0.9rem] h-[0.9rem] text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full pl-9 pr-2.5 py-2.5 text-[0.78rem] bg-[#2a2a2a]/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] transition-all"
                    placeholder="Last Name"
                  />
                </div>
                {errors.lastName && (
                  <p className="text-red-400 text-[0.72rem] mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-[0.78rem] font-medium text-gray-300 mb-1.5">
                Gender
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none z-10">
                  <svg className="w-[0.9rem] h-[0.9rem] text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => setGenderOpen((o) => !o)}
                  className={`w-full pl-9 pr-9 py-2.5 text-[0.78rem] bg-[#2a2a2a]/50 backdrop-blur-sm border rounded-lg text-left focus:outline-none focus:ring-1 transition-all ${
                    genderOpen
                      ? "border-[var(--gold-primary)] ring-1 ring-[var(--gold-primary)]"
                      : "border-gray-700/50"
                  } ${formData.gender ? "text-white" : "text-gray-500"}`}
                >
                  {formData.gender || "Select Gender"}
                </button>
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                  <svg
                    className={`w-[0.9rem] h-[0.9rem] text-gray-500 transition-transform duration-200 ${
                      genderOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {genderOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setGenderOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 w-full bg-[#1e1e1e] border border-gray-700/50 rounded-lg shadow-xl shadow-black/40 overflow-hidden">
                      {GENDER_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleGenderSelect(opt)}
                          className={`w-full text-left px-3.5 py-2.5 text-[0.78rem] transition-colors ${
                            formData.gender === opt
                              ? "bg-[var(--gold-primary)]/10 text-[var(--gold-primary)]"
                              : "text-gray-300 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {errors.gender && (
                <p className="text-red-400 text-[0.72rem] mt-1">{errors.gender}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-[0.78rem] font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none z-10">
                  <svg className="w-[0.9rem] h-[0.9rem] text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-9 pr-2.5 py-2.5 text-[0.78rem] bg-[#2a2a2a]/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] transition-all"
                  placeholder="Email"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-[0.72rem] mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[0.78rem] font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none z-10">
                  <svg className="w-[0.9rem] h-[0.9rem] text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-9 pr-9 py-2.5 text-[0.78rem] bg-[#2a2a2a]/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] transition-all"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-[0.9rem] h-[0.9rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-[0.9rem] h-[0.9rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-gray-500 text-[0.72rem] mt-1">Must be at least 8 characters.</p>
              {errors.password && (
                <p className="text-red-400 text-[0.72rem] mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSigningUp}
              className="animate-button-gradient w-full bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-black font-semibold py-2.5 rounded-lg hover:shadow-xl hover:shadow-[var(--gold-primary)]/20 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-[0.78rem]"
            >
              {isSigningUp ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          {/* Terms */}
          <p className="text-gray-500 text-[0.72rem] mt-3 text-center">
            By creating an account, you agree to the{" "}
            <Link href="/terms-of-service" className="text-[var(--gold-primary)] hover:text-[var(--gold-light)] transition-colors">
              Terms of Service
            </Link>
            . We&apos;ll occasionally send you account-related emails.
          </p>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-[0.78rem]">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-[var(--gold-primary)] hover:text-[var(--gold-light)] font-semibold transition-colors"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}