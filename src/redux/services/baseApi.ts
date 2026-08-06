// src/redux/services/baseApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

// Base API configuration
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://7i953oipvl.execute-api.us-east-1.amazonaws.com/dev",
    prepareHeaders: (headers, { getState }) => {
      // Get the cognito_sub from auth state
      const state = getState() as RootState;
      const cognitoSub = state.auth.user?.userId;

      // Set headers
      headers.set("Content-Type", "application/json");

      if (cognitoSub) {
        headers.set("Authorization", cognitoSub);
      }

      return headers;
    },
  }),
  tagTypes: ["Onboarding", "User"],
  endpoints: () => ({}),
});
