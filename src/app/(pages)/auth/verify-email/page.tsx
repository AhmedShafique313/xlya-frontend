// src/app/verify-email/page.tsx
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConfirmSignUpMutation, useResendSignUpCodeMutation } from "@/redux/services/auth/auth";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/images/Logo4.png";
import AnimatedXBackground from "@/components/common/AnimatedXBackground";
import AuthFeaturesSidebar from "@/components/auth/AuthFeaturesSidebar";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [confirmSignUp, { isLoading }] = useConfirmSignUpMutation();
  const [resendCode, { isLoading: isResending }] = useResendSignUpCodeMutation();
  
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      setError("Email address is required. Please sign up again.");
    }
  }, [email]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace") {
      if (!code[index] && index > 0) {
        // If current input is empty, focus previous input
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newCode = [...code];
        newCode[index] = "";
        setCode(newCode);
      }
    }
    // Handle arrow keys
    else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    
    if (pastedData) {
      const newCode = pastedData.split("").concat(Array(6).fill("")).slice(0, 6);
      setCode(newCode);
      setError("");
      
      // Focus the last filled input or the next empty one
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const verificationCode = code.join("");

    if (!email) {
      setError("Email address is missing. Please sign up again.");
      return;
    }

    if (verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    try {
      await confirmSignUp({ email, code: verificationCode }).unwrap();
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/login?verified=true");
      }, 2000);
    } catch (err: any) {
      console.error("Verification error:", err);
      const errorMessage = err?.error || err?.message || "Invalid verification code";
      setError(errorMessage);
      // Clear the code on error
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (!email) return;
    
    try {
      await resendCode({ email }).unwrap();
      setResendSuccess(true);
      setError("");
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.error || "Failed to resend code. Please try again.");
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen h-screen bg-black flex relative overflow-hidden">
        <AnimatedXBackground />
        <AuthFeaturesSidebar />
        
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-9 relative z-10">
          <div className="w-full max-w-md bg-[#1a1a1a]/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 my-6">
            <div className="lg:hidden mb-4 text-center">
              <Link href="/">
                <Image src={Logo} alt="Xlya Logo" width={92} height={31} className="h-auto w-auto mx-auto" />
              </Link>
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Email Required</h2>
              <p className="text-gray-400 text-[0.78rem] mb-6">
                No email address provided. Please sign up again.
              </p>
              <Link
                href="/auth/signup"
                className="inline-block bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-black font-semibold px-6 py-2.5 rounded-lg hover:shadow-xl hover:shadow-[var(--gold-primary)]/20 transition-all duration-300 text-[0.78rem]"
              >
                Back to Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen h-screen bg-black flex relative overflow-hidden">
        <AnimatedXBackground />
        <AuthFeaturesSidebar />
        
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-9 relative z-10">
          <div className="w-full max-w-md bg-[#1a1a1a]/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 my-6">
            <div className="lg:hidden mb-4 text-center">
              <Link href="/">
                <Image src={Logo} alt="Xlya Logo" width={92} height={31} className="h-auto w-auto mx-auto" />
              </Link>
            </div>
            
            <div className="text-center">
              <div className="mb-6">
                <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
              <p className="text-gray-400 text-[0.78rem] mb-6">
                Your email has been successfully verified. Redirecting to login...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen bg-black flex relative overflow-hidden">
      {/* Animated X-Shapes Background */}
      <AnimatedXBackground />

      {/* Left Side - Features */}
      <AuthFeaturesSidebar />

      {/* Right Side - Verification Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-9 relative z-10">
        <div className="w-full max-w-md bg-[#1a1a1a]/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 my-6">
          {/* Logo for mobile */}
          <div className="lg:hidden mb-4 text-center">
            <Link href="/">
              <Image src={Logo} alt="Xlya Logo" width={92} height={31} className="h-auto w-auto mx-auto" />
            </Link>
          </div>

          {/* Header */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white mb-2">Verify Your Email</h2>
            <p className="text-gray-400 text-[0.78rem]">
              We've sent a verification code to{" "}
              <span className="text-[var(--gold-primary)] font-medium">{email}</span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-[0.78rem] text-center">{error}</p>
            </div>
          )}

          {/* Resend Success Message */}
          {resendSuccess && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
              <p className="text-green-400 text-[0.78rem] text-center">Code sent successfully!</p>
            </div>
          )}

          {/* Verification Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[0.78rem] font-medium text-gray-300 mb-2">
                Verification Code
              </label>
              
              {/* 6 Input Fields */}
              <div className="flex gap-2 justify-between">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-full aspect-square text-center text-2xl font-semibold bg-[#2a2a2a]/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold-primary)] focus:ring-2 focus:ring-[var(--gold-primary)]/50 transition-all"
                    placeholder="0"
                  />
                ))}
              </div>
              
              <p className="text-gray-500 text-[0.72rem] mt-2">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || code.join("").length !== 6}
              className="animate-button-gradient w-full bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-black font-semibold py-2.5 rounded-lg hover:shadow-xl hover:shadow-[var(--gold-primary)]/20 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-[0.78rem]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Verify Email"
              )}
            </button>
          </form>

          {/* Resend Code */}
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-[0.78rem] mb-2">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              className="text-[var(--gold-primary)] hover:text-[var(--gold-light)] text-[0.78rem] font-medium transition-colors disabled:opacity-50"
            >
              {isResending ? "Sending..." : "Resend Code"}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center">
            <Link 
              href="/auth/login" 
              className="text-gray-400 text-[0.78rem] hover:text-[var(--gold-primary)] transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center  justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}