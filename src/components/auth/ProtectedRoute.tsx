// src/components/auth/ProtectedRoute.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { useGetCurrentSessionQuery, clearCredentials } from "@/redux/services/auth/auth";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, tokens } = useAppSelector((state) => state.auth);
  const { isLoading } = useGetCurrentSessionQuery();

  useEffect(() => {
    const expired = !!tokens.expiresAt && Date.now() >= tokens.expiresAt;

    if (isAuthenticated && expired) {
      dispatch(clearCredentials());
      router.push("/auth/login");
      return;
    }
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, tokens.expiresAt, dispatch, router]);

  // Already authenticated from localStorage — show children immediately
  // while getCurrentSession refreshes tokens in the background
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Not yet authenticated — wait for getCurrentSession to resolve
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[var(--gold-primary)] animate-spin" />
      </div>
    );
  }

  return null;
}