"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { setEmailVerified } from "@/redux/services/auth/auth";
import { streamEmailVerification, EmailVerificationApiError } from "@/lib/api/emailVerificationStream";
import { toast } from "@/components/snakbar";

// Wraps dashboard content that should stay locked (blurred + inert) until
// the signed-in user's email is verified, with a top bar CTA to start
// verification. Checks the live status from Cognito on mount rather than
// trusting whatever emailVerified value happened to be cached locally.
export default function EmailVerificationGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.tokens.accessToken);
  const emailVerified = useAppSelector((state) => state.auth.user?.emailVerified);
  const [checked, setChecked] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    streamEmailVerification(accessToken, { action: "status" }, (event) => {
      if (event.type !== "result") return;
      if (event.statusCode === 200 && typeof event.emailVerified === "boolean" && !cancelled) {
        dispatch(setEmailVerified(event.emailVerified));
      }
    })
      .catch((err) => console.error("Email verification status check failed:", err))
      .finally(() => {
        if (!cancelled) setChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, dispatch]);

  const handleVerifyClick = async () => {
    if (!accessToken || isSending) return;
    setIsSending(true);
    try {
      await streamEmailVerification(accessToken, { action: "send" }, (event) => {
        if (event.type !== "result") return;
        if (event.statusCode !== 200) {
          throw new EmailVerificationApiError(event.error || "Failed to send verification code", event.statusCode);
        }
      });
      toast.success("Verification code sent to your email.");
      router.push("/auth/verify-email");
    } catch (error: any) {
      console.error("Send verification code failed:", error);
      toast.error(error?.message || "Failed to send verification code. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Don't gate before the first status check resolves (avoids a flash of
  // the locked state for already-verified users), and never gate once
  // verified.
  const showGate = checked && emailVerified === false;

  return (
    <>
      {showGate && (
        <div className="flex items-center justify-between gap-4 flex-wrap rounded-xl border border-[var(--gold-primary)]/40 bg-[#2a1f0a] px-4 py-3 mb-5">
          <div className="flex items-center gap-2.5 text-[13px] text-[#f4f0e8]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Verify your email to unlock your dashboard.
          </div>
          <button
            onClick={handleVerifyClick}
            disabled={isSending}
            className="rounded-lg px-4 py-1.5 text-[12.5px] font-semibold text-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, var(--gold-primary), var(--gold-secondary))" }}
          >
            {isSending ? "Sending…" : "Verify Email"}
          </button>
        </div>
      )}

      <div className="relative">
        <div className={showGate ? "pointer-events-none select-none blur-sm opacity-60" : undefined}>
          {children}
        </div>

        {showGate && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/70 border border-[var(--gold-primary)]/40 rounded-2xl px-6 py-4 text-center backdrop-blur-sm">
              <p className="text-[#f4f0e8] text-sm font-semibold mb-1">Email verification required</p>
              <p className="text-[#9a9a9a] text-xs">Verify your email to view your dashboard.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
