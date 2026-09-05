"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Logo from "@/components/common/Logo";
import { useLandingTheme, LandingThemeToggle } from "./landingTheme";

// Six-dot grip icon — purely a visual affordance signaling the pill is
// draggable; dragging still works from anywhere on the pill's background,
// not just this icon.
function DragHandleIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="18" viewBox="0 0 12 18" fill="none" aria-hidden="true">
      {[3, 9].map((cx) =>
        [3, 9, 15].map((cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.4" fill={color} />)
      )}
    </svg>
  );
}

// Draggable floating pill navbar, landing-page only — same visual "setting"
// as the authenticated app's AppNavbar (bordered, blurred, rounded-xl pill),
// but theme-aware (dark/light) and freely draggable anywhere on screen via
// framer-motion's `drag` (resets to top-center on reload, no persistence).
// showNavLinks kept for backward compatibility with privacy-policy/terms-of-service callers; the redesigned nav has no separate menu to hide
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Navbar(_props: { showNavLinks?: boolean }) {
  const { t } = useLandingTheme();

  return (
    <div style={{ position: "fixed", top: 15, left: "50%", transform: "translateX(-50%)", zIndex: 100 }}>
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        whileDrag={{ cursor: "grabbing", scale: 1.02 }}
        style={{
          cursor: "grab",
          background: t.navBg,
          border: `1px solid ${t.navBorder}`,
          backdropFilter: "blur(20px)",
          borderRadius: 14,
          padding: "6px 8px 6px 10px",
          display: "flex",
          alignItems: "center",
          gap: 4,
          maxWidth: "92vw",
          transition: "background 0.4s ease, border-color 0.4s ease",
        }}
      >
        <span title="Drag to move" style={{ display: "inline-flex", alignItems: "center", padding: "0 6px 0 2px", opacity: 0.5 }}>
          <DragHandleIcon color={t.fgFaint} />
        </span>

        <Link href="/" style={{ display: "inline-flex", alignItems: "center", marginRight: 12, cursor: "pointer" }} onPointerDown={(e) => e.stopPropagation()}>
          <Logo size="sm" variant={t.isDark ? "dark" : "light"} />
        </Link>

        <Link href="/auth/login" style={{
          fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 400, color: t.fgMid, textDecoration: "none",
          letterSpacing: "0.01em", padding: "8px 12px", borderRadius: 8,
        }} onPointerDown={(e) => e.stopPropagation()}>
          Login
        </Link>

        <Link href="/pricing" style={{
          fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 400, color: t.fgMid, textDecoration: "none",
          letterSpacing: "0.01em", padding: "8px 12px", borderRadius: 8,
        }} onPointerDown={(e) => e.stopPropagation()}>
          Pricing
        </Link>

        <div style={{ padding: "0 6px" }} onPointerDown={(e) => e.stopPropagation()}>
          <LandingThemeToggle />
        </div>

        <Link href="/onboarding" style={{
          fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: t.ctaFg,
          background: t.ctaBg, padding: "9px 18px", borderRadius: 9, textDecoration: "none",
          letterSpacing: "0.01em", marginLeft: 4, display: "inline-block",
        }} onPointerDown={(e) => e.stopPropagation()}>
          Sign up free
        </Link>
      </motion.div>
    </div>
  );
}
