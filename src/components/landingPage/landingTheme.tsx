"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type LandingThemeTokens = {
  isDark: boolean;
  bg: string;
  surface: string;
  card: string;
  cardDeep: string;
  footer: string;
  border: string;
  borderSubtle: string;
  fg: string;
  fgMid: string;
  fgDim: string;
  fgFaint: string;
  gold: string;
  goldDim: string;
  goldGlow: string;
  barInactive: string;
  barFaint: string;
  navBg: string;
  navBorder: string;
  ctaBg: string;
  ctaFg: string;
  avatarBg: (i: number) => string;
  sectionLine: string;
  progressTrack: string;
  suggestionBg: string;
  statBg: string;
  tabActiveBg: string;
  tabActiveBorder: string;
  stepActiveBg: string;
  stepDoneBg: string;
  stepInactiveBorder: string;
};

export const darkTheme: LandingThemeTokens = {
  isDark: true,
  bg: "#0a0a0a",
  surface: "#0f0f0f",
  card: "#131313",
  cardDeep: "#111111",
  footer: "#080808",
  border: "rgba(255,255,255,0.07)",
  borderSubtle: "rgba(255,255,255,0.04)",
  fg: "#ededed",
  fgMid: "#8a8a8a",
  fgDim: "#6a6a6a",
  fgFaint: "#4a4a4a",
  gold: "#bea56f",
  goldDim: "rgba(190,165,111,0.12)",
  goldGlow: "rgba(190,165,111,0.055)",
  barInactive: "rgba(255,255,255,0.12)",
  barFaint: "rgba(255,255,255,0.05)",
  navBg: "rgba(10,10,10,0.92)",
  navBorder: "rgba(255,255,255,0.06)",
  ctaBg: "#ededed",
  ctaFg: "#0a0a0a",
  avatarBg: (i) => `hsl(${i * 60 + 200}, 15%, 22%)`,
  sectionLine: "rgba(255,255,255,0.08)",
  progressTrack: "rgba(255,255,255,0.05)",
  suggestionBg: "#0f0f0f",
  statBg: "#0a0a0a",
  tabActiveBg: "#1a1a1a",
  tabActiveBorder: "rgba(255,255,255,0.08)",
  stepActiveBg: "rgba(190,165,111,0.15)",
  stepDoneBg: "rgba(255,255,255,0.12)",
  stepInactiveBorder: "rgba(255,255,255,0.06)",
};

export const lightTheme: LandingThemeTokens = {
  isDark: false,
  bg: "#faf8f4",
  surface: "#f2efe9",
  card: "#eceae4",
  cardDeep: "#e8e5de",
  footer: "#f0ede7",
  border: "rgba(0,0,0,0.08)",
  borderSubtle: "rgba(0,0,0,0.04)",
  fg: "#1a1a18",
  fgMid: "#5a5a52",
  fgDim: "#6e6e64",
  fgFaint: "#9a9a8e",
  gold: "#8a6830",
  goldDim: "rgba(138,104,48,0.1)",
  goldGlow: "rgba(138,104,48,0.07)",
  barInactive: "rgba(0,0,0,0.1)",
  barFaint: "rgba(0,0,0,0.05)",
  navBg: "rgba(250,248,244,0.92)",
  navBorder: "rgba(0,0,0,0.07)",
  ctaBg: "#1a1a18",
  ctaFg: "#faf8f4",
  avatarBg: (i) => `hsl(${i * 60 + 200}, 15%, 82%)`,
  sectionLine: "rgba(0,0,0,0.08)",
  progressTrack: "rgba(0,0,0,0.06)",
  suggestionBg: "#f2efe9",
  statBg: "#faf8f4",
  tabActiveBg: "#faf8f4",
  tabActiveBorder: "rgba(0,0,0,0.1)",
  stepActiveBg: "rgba(138,104,48,0.12)",
  stepDoneBg: "rgba(0,0,0,0.08)",
  stepInactiveBorder: "rgba(0,0,0,0.07)",
};

const LandingThemeCtx = createContext<{ t: LandingThemeTokens; toggle: () => void }>({
  t: darkTheme,
  toggle: () => {},
});

export const useLandingTheme = () => useContext(LandingThemeCtx);

export function LandingThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const t = isDark ? darkTheme : lightTheme;
  const toggle = () => setIsDark((d) => !d);

  return (
    <LandingThemeCtx.Provider value={{ t, toggle }}>
      <div style={{ background: t.bg, minHeight: "100vh", transition: "background 0.4s" }}>
        {children}
      </div>
    </LandingThemeCtx.Provider>
  );
}

export function LandingThemeToggle() {
  const { t, toggle } = useLandingTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      style={{
        width: 36, height: 20, borderRadius: 10, cursor: "pointer",
        background: t.isDark ? "#2a2a2a" : "#d8d4cc",
        border: `1px solid ${t.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"}`,
        padding: 0, position: "relative", transition: "background 0.3s, border-color 0.3s",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: t.isDark ? 2 : 16,
        width: 14, height: 14, borderRadius: "50%",
        background: t.isDark ? "#5a5a5a" : "#faf8f4",
        transition: "left 0.25s cubic-bezier(0.34,1.56,0.64,1), background 0.3s",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 8,
      }}>
        {t.isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
