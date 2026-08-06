// src/redux/services/onboarding/onboarding.ts
import { baseApi } from "../baseApi";

/* ---------- Types ---------- */

export interface OnboardingQuestion {
  question_id: string;
  question: string;
  onboarding_required?: boolean;
  answer?: string;
}

export interface AnswerPayload {
  answer?: string;
  question_id?: string;
}

export interface OnboardingResponse {
  cognito_sub: string;
  user_type: string;
  question_id: string;
  question: string;
  answer: string;
  onboarding_completed?: boolean;
  onboarding_required?: boolean;
  message?: string;
}

export interface UserProfile {
  cognito_sub: string;
  email: string;
  first_name?: string;
  last_name?: string;
  onboarding_status: boolean;
  user_type?: string;
  created_at?: string;
}

/* ---------- API Endpoints ---------- */

export const onboardingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get user profile (includes onboarding status)
    getUserProfile: builder.query<UserProfile, void>({
      query: () => ({
        url: "/user/profile",
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    // Get onboarding status and next question
    getOnboardingQuestion: builder.query<OnboardingQuestion, void>({
      query: () => ({
        url: "/onboarding/questionaire",
        method: "POST",
        body: {},
      }),
      providesTags: ["Onboarding"],
    }),

    // Submit answer to onboarding question
    submitOnboardingAnswer: builder.mutation<OnboardingResponse, AnswerPayload>({
      query: (payload) => ({
        url: "/onboarding/questionaire",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Onboarding", "User"],
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useLazyGetUserProfileQuery,
  useGetOnboardingQuestionQuery,
  useSubmitOnboardingAnswerMutation,
  useLazyGetOnboardingQuestionQuery,
} = onboardingApi;
