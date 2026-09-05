"use client";

import Link from "next/link";
import { useLandingTheme } from "./landingTheme";

export default function Hero() {
  const { t } = useLandingTheme();
  return (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "160px 32px 120px", overflow: "hidden", background: t.bg, transition: "background 0.4s" }}>
      <div style={{
        position: "absolute", top: "38%", left: "50%", transform: "translate(-50%, -50%)",
        width: 700, height: 700, borderRadius: "50%",
        background: `radial-gradient(ellipse at center, ${t.goldGlow} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${t.gold}4d 50%, transparent)`, pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: 860, textAlign: "center" }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: "clamp(40px, 7vw, 88px)",
          fontWeight: 300, lineHeight: 1.07, letterSpacing: "-0.03em", color: t.fg, margin: "0 0 32px",
        }}>
          Your business,
          <br />
          <em style={{ fontStyle: "italic", fontWeight: 300 }}>finally working</em>
          <br />
          <span style={{ color: t.fgMid, fontWeight: 300 }}>with you.</span>
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 18, fontWeight: 300, lineHeight: 1.7, color: t.fgMid, maxWidth: 520, margin: "0 auto 52px", letterSpacing: "0.005em" }}>
          Xlya thinks alongside you. It holds the strategy, tracks the growth, and handles the execution. You stay in control of every decision.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/onboarding" style={{
            fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 500,
            color: t.ctaFg, background: t.ctaBg,
            padding: "15px 36px", borderRadius: 8, textDecoration: "none",
            letterSpacing: "0.01em", transition: "opacity 0.25s, transform 0.25s", display: "inline-block",
          }}>
            Get started free
          </Link>
        </div>
        <p style={{ marginTop: 20, fontFamily: "var(--font-body)", fontSize: 13, color: t.fgFaint, letterSpacing: "0.01em" }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: t.fgMid, textDecoration: "none", borderBottom: `1px solid ${t.border}`, paddingBottom: 1 }}>Sign in</Link>
        </p>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 180, background: `linear-gradient(to bottom, transparent, ${t.bg})`, pointerEvents: "none" }} />
    </section>
  );
}
