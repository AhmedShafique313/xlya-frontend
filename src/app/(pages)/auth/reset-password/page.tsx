"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/images/Logo4.png";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push("/login");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated X-Shapes Background */}
      <div className="x-bg-container-fixed">
        <div className="absolute top-20 left-1/4 x-lg x-gold-primary x-shape animate-float-slow"></div>
        <div className="absolute bottom-32 right-1/4 x-lg-xl x-white-medium x-shape animate-float-medium"></div>
        <div className="absolute top-1/2 right-1/3 x-lg x-gold-secondary x-shape animate-float-fast"></div>
        <div className="absolute bottom-1/4 left-1/3 x-lg x-gold-light x-shape animate-float-slow"></div>
        
        <div className="absolute top-1/4 right-20 x-md x-white-medium x-shape animate-bounce-slow"></div>
        <div className="absolute bottom-1/4 left-24 x-md-lg x-gold-dark x-shape animate-pulse-slow"></div>
        <div className="absolute top-2/3 left-1/3 x-md x-gold-accent x-shape animate-bounce-medium"></div>
        <div className="absolute top-1/3 right-1/4 x-md x-white-strong x-shape animate-float-medium"></div>
        
        <div className="absolute top-40 right-1/2 x-sm-md x-gold-primary x-shape animate-float-fast"></div>
        <div className="absolute bottom-40 left-1/2 x-sm x-white-strong x-shape animate-bounce-fast"></div>
        <div className="absolute top-1/3 left-20 x-sm-md x-gold-secondary x-shape animate-float-medium"></div>
        <div className="absolute bottom-1/2 right-1/3 x-sm x-gold-light x-shape animate-pulse-slow"></div>
      </div>

      <div className="w-full max-w-md bg-[#1a1a1a] rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="mb-8 text-center">
          <Link href="/">
            <Image
              src={Logo}
              alt="Texalya Logo"
              width={120}
              height={40}
              className="h-auto w-auto mx-auto"
            />
          </Link>
        </div>

        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--gold-primary)] to-[var(--gold-secondary)] flex items-center justify-center">
            <svg
              className="w-10 h-10 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Set New Password</h1>
          <p className="text-gray-400 text-sm">
            Your new password must be different from previously used passwords
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold-primary)] transition-colors"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--gold-primary)] transition-colors"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-secondary)] text-black font-semibold py-3 rounded-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-gray-400 hover:text-[var(--gold-primary)] text-sm transition-colors inline-flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}