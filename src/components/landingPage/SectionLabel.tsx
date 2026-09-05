"use client";

import { useLandingTheme } from "./landingTheme";

export default function SectionLabel({ number, label }: { number: string; label: string }) {
  const { t } = useLandingTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 52 }}>
      <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: t.fgFaint, letterSpacing: "0.12em", textTransform: "uppercase" }}>{number}</span>
      <div style={{ width: 32, height: 1, background: t.sectionLine }} />
      <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: t.fgDim, letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}
