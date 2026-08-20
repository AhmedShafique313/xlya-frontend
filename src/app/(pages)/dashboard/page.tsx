"use client";

import { Archivo } from "next/font/google";
import Logo from "@/components/common/Logo";
import type { ReactNode } from "react";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
});

const navGeneral = [
  {
    label: "Payments",
    icon: (
      <>
        <rect x="1" y="4" width="22" height="16" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </>
    ),
  },
  {
    label: "Customers",
    icon: (
      <>
        <circle cx="9" cy="7" r="4" />
        <path d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2" />
      </>
    ),
  },
  {
    label: "Message",
    icon: (
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    ),
  },
];

const navTools = [
  {
    label: "Model Library",
    icon: (
      <>
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </>
    ),
  },
  {
    label: "API Keys",
    icon: (
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    ),
  },
  {
    label: "Analytics",
    icon: (
      <>
        <path d="M3 3v18h18" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />
      </>
    ),
  },
  {
    label: "Automation",
    icon: <path d="M12 2l9 4.5v9L12 20l-9-4.5v-9z" />,
    badge: "BETA",
  },
];

const navSupport = [
  {
    label: "Settings",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </>
    ),
  },
  {
    label: "Security",
    icon: <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />,
  },
  {
    label: "Help",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 115.83 1c0 2-3 2-3 4" />
        <line x1="12" y1="17" x2="12" y2="17" />
      </>
    ),
  },
];

const kpis = [
  {
    label: "Generations",
    icon: (
      <>
        <path d="M12 2v20" />
        <path d="M2 12h20" />
      </>
    ),
    value: "128,450",
    delta: "↗ 15.8%",
    positive: true,
  },
  {
    label: "Total Revenue",
    icon: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </>
    ),
    value: "$84,392",
    delta: "↗ 24.0%",
    positive: true,
  },
  {
    label: "Churn Rate",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8" />
      </>
    ),
    value: "4.2%",
    delta: "↘ 1.3%",
    positive: false,
  },
];

const userBars = [
  { day: "Sun", height: 45, active: false },
  { day: "Mon", height: 62, active: false },
  { day: "Tue", height: 118, active: true, count: "3,874" },
  { day: "Wed", height: 36, active: false },
  { day: "Thu", height: 54, active: false },
  { day: "Fri", height: 72, active: false },
  { day: "Sat", height: 58, active: false },
];

const spendBreakdown = [
  { label: "Training", value: "$52.4k", color: "var(--gold-primary)" },
  { label: "Inference", value: "$26.2k", color: "var(--gold-secondary)" },
  { label: "Storage", value: "$8.7k", color: "#5c4d2c" },
];

const integrations = [
  { name: "Stripe", type: "Finance", rate: "40%", profit: "$650.00", initial: "S", iconBg: "#635bff" },
  { name: "Zapier", type: "Workflow", rate: "80%", profit: "$720.50", initial: "Z", iconBg: "#ff4f00" },
  { name: "Shopify", type: "Marketplace", rate: "20%", profit: "$432.25", initial: "S", iconBg: "#95bf47" },
  { name: "Slack", type: "Comms", rate: "60%", profit: "$310.10", initial: "S", iconBg: "#611f69" },
];

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {children}
    </svg>
  );
}

export default function DashboardPage() {
  return (
    <div className={`${archivo.className} min-h-screen flex p-6 md:p-10 text-[#f4f0e8]`}>
      <div className="flex flex-1 min-w-0 border border-[#1c1c1c] rounded-3xl overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[248px] flex-none bg-black border-r border-[#1c1c1c] flex flex-col p-7">
          <div className="flex items-center gap-2.5 mb-9">
            <div
              className="w-[30px] h-[30px] flex-none rounded-lg"
              style={{ background: "linear-gradient(135deg, var(--gold-primary) 40%, var(--gold-secondary) 100%)" }}
            />
            <Logo size="sm" className="!text-[18px]" />
          </div>

          <div className="text-[11px] font-semibold tracking-[0.08em] text-[#6b6b6b] mb-2.5 ml-1">GENERAL</div>
          <nav className="flex flex-col gap-0.5 mb-7">
            <div
              className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-r-md border-l-2"
              style={{ background: "rgba(204,172,93,0.12)", borderColor: "var(--gold-primary)" }}
            >
              <span style={{ color: "var(--gold-primary)" }}>
                <NavIcon>
                  <rect x="3" y="3" width="7" height="9" />
                  <rect x="14" y="3" width="7" height="5" />
                  <rect x="14" y="12" width="7" height="9" />
                  <rect x="3" y="16" width="7" height="5" />
                </NavIcon>
              </span>
              <span className="text-[13.5px] font-medium text-[#f4f0e8]">Dashboard</span>
            </div>
            {navGeneral.map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 pl-3 pr-2.5 py-2.5">
                <span className="text-[#7d7d7d]">
                  <NavIcon>{item.icon}</NavIcon>
                </span>
                <span className="text-[13.5px] font-medium text-[#9a9a9a]">{item.label}</span>
              </div>
            ))}
          </nav>

          <div className="text-[11px] font-semibold tracking-[0.08em] text-[#6b6b6b] mb-2.5 ml-1">MODELS &amp; TOOLS</div>
          <nav className="flex flex-col gap-0.5 mb-7">
            {navTools.map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 pl-3 pr-2.5 py-2.5">
                <span className="text-[#7d7d7d]">
                  <NavIcon>{item.icon}</NavIcon>
                </span>
                <span className="text-[13.5px] font-medium text-[#9a9a9a]">{item.label}</span>
                {item.badge && (
                  <span
                    className="ml-auto text-[9px] font-bold tracking-[0.04em] rounded-full border px-1.5 py-0.5"
                    style={{ color: "var(--gold-secondary)", borderColor: "#3a3226" }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </nav>

          <div className="text-[11px] font-semibold tracking-[0.08em] text-[#6b6b6b] mb-2.5 ml-1">SUPPORT</div>
          <nav className="flex flex-col gap-0.5">
            {navSupport.map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 pl-3 pr-2.5 py-2.5">
                <span className="text-[#7d7d7d]">
                  <NavIcon>{item.icon}</NavIcon>
                </span>
                <span className="text-[13.5px] font-medium text-[#9a9a9a]">{item.label}</span>
              </div>
            ))}
          </nav>

          <div className="mt-auto pt-6">
            <div className="border border-[#232323] rounded-xl p-3.5 flex flex-col gap-2.5 mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-[26px] h-[26px] flex-none rounded-lg"
                  style={{ background: "linear-gradient(135deg, var(--gold-primary), var(--gold-secondary))" }}
                />
                <div className="text-[12.5px] font-semibold leading-tight text-[#f4f0e8]">Pro Workspace</div>
              </div>
              <div className="text-[11.5px] leading-snug text-[#7d7d7d]">
                Unlimited generations &amp; priority compute
              </div>
            </div>
            <button
              className="w-full text-left rounded-lg border px-3 py-2.5 text-[12.5px] font-semibold tracking-wide"
              style={{ borderColor: "var(--gold-primary)", color: "var(--gold-primary)" }}
            >
              Upgrade Plan
            </button>
            <div className="text-[10.5px] text-[#4d4d4d] mt-4">© 2026 xlya, Inc.</div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 px-9 pt-7 pb-12">
          {/* Topbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5 border border-[#232323] rounded-lg px-3.5 py-2.5 w-[340px]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="text-[13px] text-[#5c5c5c]">Search</span>
              <span className="ml-auto text-[11px] font-medium text-[#4d4d4d]">⌘ + F</span>
            </div>
            <div className="flex items-center gap-4.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="2">
                <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <div className="w-px h-[22px] bg-[#232323]" />
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ background: "linear-gradient(135deg, var(--gold-primary), var(--gold-secondary))" }}
                />
                <div>
                  <div className="text-[12.5px] font-semibold leading-tight text-[#f4f0e8]">Elena Voss</div>
                  <div className="text-[11px] leading-tight text-[#6b6b6b]">Studio Lead</div>
                </div>
              </div>
            </div>
          </div>

          {/* Header row */}
          <div className="flex items-center justify-between mb-5.5">
            <h1 className="text-2xl font-bold text-[#f4f0e8]">Dashboard</h1>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 border border-[#232323] rounded-lg px-3.5 py-2 text-[12.5px] font-medium text-[#9a9a9a]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Oct 18 – Nov 18
              </div>
              <div className="border border-[#232323] rounded-lg px-3.5 py-2 text-[12.5px] font-medium text-[#9a9a9a]">
                Monthly ▾
              </div>
              <div className="border border-[#232323] rounded-lg px-3.5 py-2 text-[12.5px] font-medium text-[#9a9a9a]">
                Filter
              </div>
              <div
                className="rounded-lg px-4 py-2 text-[12.5px] font-semibold text-[#0a0a0a]"
                style={{ background: "linear-gradient(135deg, var(--gold-primary), var(--gold-secondary))" }}
              >
                Export
              </div>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {kpis.map((k) => (
              <div key={k.label} className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2 text-[12.5px] font-medium text-[#9a9a9a]">
                    <span style={{ color: "var(--gold-primary)" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {k.icon}
                      </svg>
                    </span>
                    {k.label}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4d4d4d" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <div className="text-[26px] font-bold text-[#f4f0e8]">{k.value}</div>
                  <div
                    className="text-[11.5px] font-semibold rounded-md px-1.5 py-0.5"
                    style={
                      k.positive
                        ? { color: "var(--gold-primary)", background: "rgba(204,172,93,0.12)" }
                        : { color: "#e0806b", background: "rgba(224,128,107,0.12)" }
                    }
                  >
                    {k.delta}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1.65fr 1fr" }}>
            <div className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-5.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-[13px] font-medium text-[#9a9a9a]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
                    <path d="M3 3v18h18" />
                    <path d="M18 17V9" />
                    <path d="M13 17V5" />
                    <path d="M8 17v-3" />
                  </svg>
                  Generation Volume
                </div>
                <div className="flex gap-2">
                  <div className="border border-[#232323] rounded-lg px-3 py-1.5 text-[11.5px] font-medium text-[#9a9a9a]">
                    Filter
                  </div>
                  <div className="border border-[#232323] rounded-lg px-3 py-1.5 text-[11.5px] font-medium text-[#9a9a9a]">
                    Sort
                  </div>
                </div>
              </div>
              <div className="flex items-baseline gap-3 mb-5.5">
                <div className="text-[28px] font-bold text-[#f4f0e8]">
                  928,410 <span className="text-[15px] font-medium text-[#6b6b6b]">renders</span>
                </div>
                <div className="text-xs font-semibold" style={{ color: "var(--gold-primary)" }}>
                  ↗ 15.8%
                </div>
              </div>
              <svg viewBox="0 0 560 190" width="100%" height="190" style={{ overflow: "visible" }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold-primary)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--gold-primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="150" x2="560" y2="150" stroke="#1c1c1c" />
                <path
                  d="M0,110 L80,95 L160,140 L240,60 L320,130 L400,40 L480,100 L560,20 L560,190 L0,190 Z"
                  fill="url(#areaGrad)"
                />
                <path
                  d="M0,110 L80,95 L160,140 L240,60 L320,130 L400,40 L480,100 L560,20"
                  fill="none"
                  stroke="var(--gold-primary)"
                  strokeWidth="2.5"
                />
                <circle cx="240" cy="60" r="4" fill="#0a0a0a" stroke="var(--gold-primary)" strokeWidth="2" />
                <circle cx="560" cy="20" r="4" fill="#0a0a0a" stroke="var(--gold-primary)" strokeWidth="2" />
              </svg>
              <div className="flex justify-between mt-2 text-[11.5px] font-medium text-[#6b6b6b]">
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
              </div>
            </div>

            <div className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-5.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-[13px] font-medium text-[#9a9a9a]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  Active Users
                </div>
                <div className="border border-[#232323] rounded-lg px-3 py-1.5 text-[11.5px] font-medium text-[#9a9a9a]">
                  Weekly ▾
                </div>
              </div>
              <div className="flex items-baseline gap-3 mb-5.5">
                <div className="text-[28px] font-bold text-[#f4f0e8]">31,208</div>
                <div className="text-xs font-semibold" style={{ color: "var(--gold-primary)" }}>
                  ↗ 8.3%
                </div>
              </div>
              <div className="flex items-end gap-3.5 h-[150px]">
                {userBars.map((b) => (
                  <div key={b.day} className="flex flex-col items-center justify-end gap-2 flex-1 h-full">
                    {b.active && (
                      <div className="text-[11px] font-semibold" style={{ color: "var(--gold-primary)" }}>
                        {b.count}
                      </div>
                    )}
                    <div
                      className="w-full rounded-t"
                      style={{
                        height: `${b.height}px`,
                        background: b.active
                          ? "linear-gradient(180deg, var(--gold-primary), var(--gold-secondary))"
                          : "#2a2a2a",
                      }}
                    />
                    <div className="text-[11px] font-medium text-[#6b6b6b]">{b.day}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1.6fr" }}>
            <div className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-5.5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-[13px] font-medium text-[#9a9a9a]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                  Compute Spend
                </div>
                <div className="border border-[#232323] rounded-lg px-3 py-1.5 text-[11.5px] font-medium text-[#9a9a9a]">
                  Monthly ▾
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-6.5">
                {spendBreakdown.map((s) => (
                  <div key={s.label} className="border-l-2 pl-2.5" style={{ borderColor: s.color }}>
                    <div className="text-[11.5px] text-[#6b6b6b] mb-1.5">{s.label}</div>
                    <div className="text-[15px] font-bold text-[#f4f0e8]">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <circle cx="90" cy="90" r="70" fill="none" stroke="#1c1c1c" strokeWidth="20" />
                  <circle
                    cx="90"
                    cy="90"
                    r="70"
                    fill="none"
                    stroke="var(--gold-primary)"
                    strokeWidth="20"
                    strokeDasharray="264 440"
                    strokeDashoffset="0"
                    transform="rotate(-90 90 90)"
                  />
                  <circle
                    cx="90"
                    cy="90"
                    r="70"
                    fill="none"
                    stroke="var(--gold-secondary)"
                    strokeWidth="20"
                    strokeDasharray="132 440"
                    strokeDashoffset="-264"
                    transform="rotate(-90 90 90)"
                  />
                  <circle
                    cx="90"
                    cy="90"
                    r="70"
                    fill="none"
                    stroke="#5c4d2c"
                    strokeWidth="20"
                    strokeDasharray="44 440"
                    strokeDashoffset="-396"
                    transform="rotate(-90 90 90)"
                  />
                </svg>
              </div>
            </div>

            <div className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-5.5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[13px] font-medium text-[#9a9a9a]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
                    <path d="M17 1l4 4-4 4" />
                    <path d="M3 11V9a4 4 0 014-4h14" />
                    <path d="M7 23l-4-4 4-4" />
                    <path d="M21 13v2a4 4 0 01-4 4H3" />
                  </svg>
                  Connected Integrations
                </div>
                <a href="#" className="text-xs font-semibold" style={{ color: "var(--gold-primary)" }}>
                  See All
                </a>
              </div>
              <div
                className="grid pb-2.5 border-b border-[#1c1c1c] text-[10.5px] font-semibold tracking-[0.06em] text-[#5c5c5c]"
                style={{ gridTemplateColumns: "2fr 1fr 1.2fr 1fr" }}
              >
                <div>APPLICATION</div>
                <div>TYPE</div>
                <div>RATE</div>
                <div>PROFIT</div>
              </div>
              {integrations.map((row) => (
                <div
                  key={row.name}
                  className="grid py-3.5 border-b border-[#161616] items-center"
                  style={{ gridTemplateColumns: "2fr 1fr 1.2fr 1fr" }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-[26px] h-[26px] flex-none rounded-lg flex items-center justify-center text-xs font-bold text-[#0a0a0a]"
                      style={{ background: row.iconBg }}
                    >
                      {row.initial}
                    </div>
                    <span className="text-[13px] font-medium text-[#f4f0e8]">{row.name}</span>
                  </div>
                  <div className="text-[12.5px] text-[#9a9a9a]">{row.type}</div>
                  <div className="flex items-center gap-2">
                    <div className="w-[60px] h-1 rounded-full bg-[#1c1c1c]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: row.rate, background: "var(--gold-primary)" }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[#9a9a9a]">{row.rate}</span>
                  </div>
                  <div className="text-[13px] font-semibold text-[#f4f0e8]">{row.profit}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
