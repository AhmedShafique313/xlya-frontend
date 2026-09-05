"use client";

import Link from "next/link";
import Logo from "@/components/common/Logo";
import { useLandingTheme } from "./landingTheme";

export default function Footer() {
  const { t } = useLandingTheme();
  const currentYear = new Date().getFullYear();
  return (
    <footer style={{ background: t.footer, borderTop: `1px solid ${t.borderSubtle}`, padding: "48px 32px", transition: "background 0.4s" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", opacity: 0.7 }}>
          <Logo size="sm" variant={t.isDark ? "dark" : "light"} />
        </Link>
        <div style={{ display: "flex", gap: 32 }}>
          {[
            { label: "Privacy", href: "/privacy-policy" },
            { label: "Terms", href: "/terms-of-service" },
          ].map((item) => (
            <Link key={item.label} href={item.href} style={{ fontFamily: "var(--font-body)", fontSize: 13, color: t.fgFaint, textDecoration: "none", transition: "color 0.2s" }}>
              {item.label}
            </Link>
          ))}
        </div>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: t.fgFaint, opacity: 0.4 }}>{currentYear} Xlya Inc.</span>
      </div>
    </footer>
  );
}
