// Session-scoped handoff of onboarding answers from /onboarding to /auth/signup,
// where they're merged into the single signup+onboarding API call.
export const ONBOARDING_ANSWERS_STORAGE_KEY = "xlya_onboarding_answers";

export interface StoredOnboardingAnswers {
  businessType?: string;
  challenge?: string;
  teamSize?: string;
  websiteUrl?: string;
}

// Canonical slug->label pairs for the three onboarding answers editable from
// the Settings screen. Mirrors the option datasets defined locally in
// onboarding/page.tsx (kept in sync manually — that page's own copies are
// left as-is since it isn't broken) so Settings shows the exact same label
// text rather than inventing new copy for the same confirmed API enum values.
export const BUSINESS_TYPE_OPTIONS = [
  { value: "ecommerce", label: "E-commerce & retail" },
  { value: "saas", label: "SaaS / tech product" },
  { value: "agency", label: "Agency or freelance" },
  { value: "creator", label: "Creator or personal brand" },
  { value: "local", label: "Local business" },
  { value: "other", label: "Something else" },
];

export const CHALLENGE_OPTIONS = [
  { value: "content", label: "Creating enough content" },
  { value: "leads", label: "Finding and converting leads" },
  { value: "ops", label: "Manual, repetitive work" },
  { value: "scale", label: "Scaling without hiring" },
];

export const TEAM_SIZE_OPTIONS = [
  { value: "solo", label: "Just me" },
  { value: "small", label: "2–10 people" },
  { value: "medium", label: "11+ people" },
];
