"use client";

import { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Logo from "@/assets/images/Logo4.png";
import AnimatedXBackground from "@/components/common/AnimatedXBackground";
import AuthFeaturesSidebar from "@/components/auth/AuthFeaturesSidebar";
import { useResetPasswordMutation, useConfirmResetPasswordMutation } from "@/redux/services/auth/auth";
import { toast } from "@/components/snakbar";

type Step = "email" | "otp" | "password";
const STEPS: Step[] = ["email", "otp", "password"];

/* ─── Defined OUTSIDE the page component to prevent remount on every render ─── */

function StepDots({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-2 mb-5">
      {STEPS.map((s, i) => (
        <div
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i <= idx ? "w-8 bg-[var(--gold-primary)]" : "w-4 bg-gray-700"
          }`}
        />
      ))}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md bg-[#1a1a1a]/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 my-6">
      <div className="lg:hidden mb-4 text-center">
        <Link href="/">
          <Image src={Logo} alt="Xlya Logo" width={92} height={31} className="h-auto w-auto mx-auto" />
        </Link>
      </div>
      {children}
    </div>
  );
}

/* ─── Main page content ─── */

function ForgotPasswordContent() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [savedOtp, setSavedOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [sendResetCode, { isLoading: isSendingCode }] = useResetPasswordMutation();
  const [confirmReset, { isLoading: isResetting }] = useConfirmResetPasswordMutation();

  /* ─── Step 1: Send OTP to email ─── */
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    if (!email.trim()) { setEmailError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError("Email is invalid"); return; }

    try {
      await sendResetCode({ email }).unwrap();
      setStep("otp");
    } catch (err: any) {
      const msg = err?.error || err?.message || "Failed to send reset code";
      if (
        msg.includes("User does not exist") ||
        msg.includes("Username/client id combination not found") ||
        msg.includes("UserNotFoundException")
      ) {
        setEmailError("No account found with this email");
      } else {
        toast.error(msg);
      }
    }
  };

  /* ─── Step 2: Validate OTP client-side, then move to step 3 ─── */
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setOtpError("Please enter the complete 6-digit code");
      return;
    }
    setSavedOtp(code);
    setStep("password");
  };

  /* ─── Step 3: Confirm password reset via Cognito ─── */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!newPassword) { setPasswordError("Password is required"); return; }
    if (newPassword.length < 8) { setPasswordError("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match"); return; }

    try {
      await confirmReset({ email, code: savedOtp, newPassword }).unwrap();
      toast.success("Password reset successfully! Please login with your new password.");
      router.push("/auth/login");
    } catch (err: any) {
      const msg = err?.error || err?.message || "Failed to reset password";
      if (
        msg.includes("Invalid verification code") ||
        msg.includes("CodeMismatchException") ||
        msg.includes("ExpiredCodeException")
      ) {
        toast.error("Invalid or expired code. Please request a new one.");
        setOtpDigits(["", "", "", "", "", ""]);
        setSavedOtp("");
        setStep("email");
      } else if (msg.toLowerCase().includes("password")) {
        setPasswordError(
          "Password must contain uppercase, lowercase, numbers, and special characters"
        );
      } else {
        toast.error(msg);
      }
    }
  };

  /* ─── Resend OTP ─── */
  const handleResendCode = async () => {
    try {
      await sendResetCode({ email }).unwrap();
      toast.success("A new code has been sent to your email.");
    } catch (err: any) {
      toast.error(err?.error || "Failed to resend code. Please try again.");
    }
  };

  /* ─── OTP input handlers ─── */
  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);
    setOtpError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const updated = [...otpDigits];
        updated[index] = "";
        setOtpDigits(updated);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const updated = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
      setOtpDigits(updated);
      setOtpError("");
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  return (
    <div className="min-h-screen h-screen bg-black flex relative overflow-hidden">
      <AnimatedXBackground />
      <AuthFeaturesSidebar />

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-9 relative z-10">

        {/* ── Step 1: Enter Email ── */}
        {step === "email" && (
          <Card>
            <StepDots current={step} />

            <div className="mb-5">
              <h2 className="text-xl font-bold text-white mb-1.5">Forgot Password?</h2>
              <p className="text-gray-400 text-[0.78rem]">
                Enter your email and we&apos;ll send you a reset code.
              </p>
            </div>

            <form onSubmit={handleSendCode} className="space-y-3.5">
              <div>
                <label className="block text-[0.78rem] font-medium text-gray-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none z-10">
                    <svg className="w-[0.9rem] h-[0.9rem] text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                    className="w-full pl-9 pr-2.5 py-2.5 text-[0.78rem] bg-[#2a2a2a]/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] transition-all"
                    placeholder="Enter your email"
                  />
                </div>
                {emailError && <p className="text-red-400 text-[0.72rem] mt-1">{emailError}</p>}
              </div>

              <button
                type="submit"
                disabled={isSendingCode}
                className="animate-button-gradient w-full bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-black font-semibold py-2.5 rounded-lg hover:shadow-xl hover:shadow-[var(--gold-primary)]/20 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-[0.78rem]"
              >
                {isSendingCode ? "Sending Code..." : "Send Reset Code"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link
                href="/auth/login"
                className="text-gray-400 text-[0.78rem] hover:text-[var(--gold-primary)] transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </Card>
        )}

        {/* ── Step 2: Enter OTP ── */}
        {step === "otp" && (
          <Card>
            <StepDots current={step} />

            <div className="mb-4">
              <h2 className="text-xl font-bold text-white mb-1.5">Check Your Email</h2>
              <p className="text-gray-400 text-[0.78rem]">
                We sent a 6-digit code to{" "}
                <span className="text-[var(--gold-primary)] font-medium">{email}</span>
              </p>
            </div>

            {otpError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-[0.78rem] text-center">{otpError}</p>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-[0.78rem] font-medium text-gray-300 mb-2">
                  Reset Code
                </label>
                <div className="flex gap-2 justify-between">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="w-full aspect-square text-center text-2xl font-semibold bg-[#2a2a2a]/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold-primary)] focus:ring-2 focus:ring-[var(--gold-primary)]/50 transition-all"
                      placeholder="0"
                    />
                  ))}
                </div>
                <p className="text-gray-500 text-[0.72rem] mt-2">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <button
                type="submit"
                disabled={otpDigits.join("").length !== 6}
                className="animate-button-gradient w-full bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-black font-semibold py-2.5 rounded-lg hover:shadow-xl hover:shadow-[var(--gold-primary)]/20 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-[0.78rem]"
              >
                Verify Code
              </button>
            </form>

            <div className="mt-4 text-center space-y-2">
              <p className="text-gray-400 text-[0.78rem]">Didn&apos;t receive the code?</p>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isSendingCode}
                className="text-[var(--gold-primary)] hover:text-[var(--gold-light)] text-[0.78rem] font-medium transition-colors disabled:opacity-50"
              >
                {isSendingCode ? "Sending..." : "Resend Code"}
              </button>
            </div>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-gray-400 text-[0.78rem] hover:text-[var(--gold-primary)] transition-colors"
              >
                Back
              </button>
            </div>
          </Card>
        )}

        {/* ── Step 3: Set New Password ── */}
        {step === "password" && (
          <Card>
            <StepDots current={step} />

            <div className="mb-5">
              <h2 className="text-xl font-bold text-white mb-1.5">Set New Password</h2>
              <p className="text-gray-400 text-[0.78rem]">
                Enter and confirm your new password below.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              {/* New Password */}
              <div>
                <label className="block text-[0.78rem] font-medium text-gray-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none z-10">
                    <svg className="w-[0.9rem] h-[0.9rem] text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
                    className="w-full pl-9 pr-9 py-2.5 text-[0.78rem] bg-[#2a2a2a]/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] transition-all"
                    placeholder="New Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-[0.9rem] h-[0.9rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-[0.9rem] h-[0.9rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-gray-500 text-[0.72rem] mt-1">Must be at least 8 characters.</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[0.78rem] font-medium text-gray-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none z-10">
                    <svg className="w-[0.9rem] h-[0.9rem] text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                    className="w-full pl-9 pr-9 py-2.5 text-[0.78rem] bg-[#2a2a2a]/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] transition-all"
                    placeholder="Confirm Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-[0.9rem] h-[0.9rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-[0.9rem] h-[0.9rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {passwordError && (
                <p className="text-red-400 text-[0.72rem]">{passwordError}</p>
              )}

              <button
                type="submit"
                disabled={isResetting}
                className="animate-button-gradient w-full bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-black font-semibold py-2.5 rounded-lg hover:shadow-xl hover:shadow-[var(--gold-primary)]/20 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-[0.78rem]"
              >
                {isResetting ? "Resetting Password..." : "Reset Password"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setStep("otp")}
                className="text-gray-400 text-[0.78rem] hover:text-[var(--gold-primary)] transition-colors"
              >
                Back
              </button>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
