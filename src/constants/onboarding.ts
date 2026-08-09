// Session-scoped handoff of onboarding answers from /onboarding to /auth/signup,
// where they're merged into the single signup+onboarding API call.
export const ONBOARDING_ANSWERS_STORAGE_KEY = "xlya_onboarding_answers";

export interface StoredOnboardingAnswers {
  businessType?: string;
  challenge?: string;
  teamSize?: string;
  websiteUrl?: string;
}
