// src/components/auth/ProtectedRoute.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import { useGetCurrentSessionQuery } from "@/redux/services/auth/auth";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { isLoading } = useGetCurrentSessionQuery();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

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