// src/redux/services/auth/profileInfo.ts
import { baseApi } from "../baseApi";

/* ---------- Types ---------- */

export interface SocialLinks {
  youtube?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
}

export interface ProfileInfo {
  first_name: string;
  last_name: string;
  email: string;
  image?: string;
  gender?: string;
  country?: string;
  address?: string;
  phone_number?: string;
  age?: number;
  social_links?: SocialLinks;
  onboarding_status: boolean;
}

/* ---------- API ---------- */

export const profileInfoApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfileInfo: builder.query<ProfileInfo, void>({
      query: () => ({
        url: "/profile/profile-info",
        method: "GET",
      }),
      providesTags: ["User"],
    }),
  }),
});

export const { useGetProfileInfoQuery, useLazyGetProfileInfoQuery } = profileInfoApi;
