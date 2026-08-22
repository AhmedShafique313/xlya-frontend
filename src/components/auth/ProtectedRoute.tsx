// src/components/auth/ProtectedRoute.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { clearCredentials } from "@/redux/services/auth/auth";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, tokens } = useAppSelector((state) => state.auth);

  // Redux is hydrated from localStorage synchronously when the store is
  // created (see redux/store.ts's loadFromStorage() dispatch) — but that
  // hydration only happens client-side (localStorage doesn't exist during
  // SSR), so isAuthenticated is false on the server and can already be true
  // on the very first client render. Rendering off isAuthenticated directly
  // therefore mismatches the server-rendered HTML (a hydration error).
  // hasMounted forces both the server render and the first client render to
  // agree (always the loading state) — the real, possibly-different content
  // only appears in a second, purely client-side pass after that.
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // No Amplify session check: signup/login no longer use Amplify's own auth
  // (they call the custom Cognito lambdas directly), so Amplify never has a
  // session for these tokens — calling it here previously caused it to
  // report "unauthenticated" and clear valid, just-set credentials, bouncing
  // straight back to /auth/login right after a successful login.
  useEffect(() => {
    if (!hasMounted) return;

    const expired = !!tokens.expiresAt && Date.now() >= tokens.expiresAt;

    if (isAuthenticated && expired) {
      dispatch(clearCredentials());
      router.push("/auth/login");
      return;
    }
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [hasMounted, isAuthenticated, tokens.expiresAt, dispatch, router]);

  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[var(--gold-primary)] animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return null;
}