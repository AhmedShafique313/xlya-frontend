"use client";

import Link from "next/link";
import Logo from "@/components/common/Logo";
import { useLandingTheme } from "@/components/landingPage/landingTheme";

export default function AuthFeaturesSidebar() {
  const { t } = useLandingTheme();

  const features = [
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      ),
      title: "Invite unlimited colleagues",
      body: "Invite as many teammates as you'd like or need to spend to collaborate on different creative projects.",
    },
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      ),
      title: "Ensure compliance",
      body: "Provide detailed reports so all your numbers is in real time, see where users are dropping off.",
    },
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      ),
      title: "Built in security",
      body: "Keep your team members and stakeholders in the loop so that your operations is visible and transparent.",
    },
  ];

  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-14 relative z-10">
      <div className="mb-7">
        <Link href="/">
          <Logo size="lg" variant={t.isDark ? "dark" : "light"} />
        </Link>
      </div>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 300,
          fontSize: "clamp(28px, 3vw, 34px)",
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
          color: t.fg,
          margin: "0 0 10px",
        }}
      >
        Start your 30-day free trial
      </h1>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: t.fgMid, marginBottom: 40, display: "flex", alignItems: "center", gap: 8 }}>
        <svg className="w-[1.1rem] h-[1.1rem]" style={{ color: t.gold }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        No credit card required
      </p>

      <div className="space-y-7">
        {features.map((f, i) => (
          <div key={i} className="flex items-start gap-3.5">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: t.goldDim, border: `1px solid ${t.gold}33` }}
            >
              <svg className="w-[1.4rem] h-[1.4rem]" style={{ color: t.gold }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {f.icon}
              </svg>
            </div>
            <div>
              <h3 style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 16, color: t.fg, margin: "0 0 4px" }}>
                {f.title}
              </h3>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: t.fgMid, lineHeight: 1.6, margin: 0 }}>
                {f.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
