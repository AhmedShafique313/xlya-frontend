"use client";

import { Archivo } from "next/font/google";
import EmailVerificationGate from "@/components/dashboard/EmailVerificationGate";
import MarketAnalysis from "@/components/dashboard/MarketAnalysis";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
});

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

export default function DashboardPage() {
  return (
    <div className={`${archivo.className} min-h-screen flex justify-center p-6 md:p-10 pt-24 text-[#f4f0e8]`}>
      <div className="w-full max-w-[1440px] min-w-0 border border-[#1c1c1c] bg-[#0f0f0f] rounded-3xl overflow-hidden">
        {/* Main */}
        <main className="min-w-0 px-9 pt-7 pb-12">
          <EmailVerificationGate>
          <MarketAnalysis />
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
          </EmailVerificationGate>
        </main>
      </div>
    </div>
  );
}
