"use client";

import { useLandingTheme } from "@/components/landingPage/landingTheme";

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const { t } = useLandingTheme();

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 sm:px-10 lg:px-16 py-7 sm:py-9 animate-fadeIn">
      {/* Badge */}
      <div className="mb-4">
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-body)",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: t.gold,
            border: `1px solid ${t.gold}4d`,
            background: t.goldDim,
            padding: "6px 16px",
            borderRadius: 999,
          }}
        >
          <span
            className="animate-pulse"
            style={{ width: 6, height: 6, borderRadius: "50%", background: t.gold }}
          />
          Quick setup
        </span>
      </div>

      {/* Heading */}
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 300,
          fontSize: "clamp(30px, 5vw, 46px)",
          lineHeight: 1.12,
          letterSpacing: "-0.02em",
          color: t.fg,
          margin: "0 0 12px",
        }}
      >
        Help Xlya personalize
        <br />
        <em style={{ fontStyle: "italic", color: t.gold }}>your experience</em>
      </h1>

      <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: t.fgMid, marginBottom: 8, fontWeight: 400 }}>
        in under 60 seconds.
      </p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: t.fgDim, maxWidth: 360, marginBottom: 28, lineHeight: 1.6 }}>
        Answer a few quick questions so we can build the perfect workspace tailored just for you.
      </p>

      {/* CTA */}
      <button
        onClick={onStart}
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          fontWeight: 500,
          color: t.ctaFg,
          background: t.ctaBg,
          padding: "13px 32px",
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          transition: "opacity 0.25s, transform 0.25s",
        }}
      >
        Get started
      </button>

      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: t.fgFaint, marginTop: 12 }}>
        You can always update these preferences later in settings
      </p>
    </div>
  );
}
