import { configureStore } from "@reduxjs/toolkit";
import { authReducer, authApi, loadFromStorage } from "./services/auth/auth";
import { baseApi } from "./services/baseApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(baseApi.middleware),
});

// Hydrate auth state from UserData localStorage on every page load.
// This must run synchronously before any React component renders so
// ProtectedRoute sees isAuthenticated = true immediately on refresh.
if (typeof window !== "undefined") {
  store.dispatch(loadFromStorage());
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
