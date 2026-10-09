"use client";

import { useState } from "react";
import Image, { type StaticImageData } from "next/image";
import type { VibeAgentJobSummary } from "@/lib/api/vibeProspectingAgentStream";
import { useLandingTheme } from "@/components/landingPage/landingTheme";

export interface AgentDef {
  id: string;
  name: string;
  description: string;
  logo: StaticImageData;
}

interface AgentsSidebarProps {
  agents: AgentDef[];
  selectedAgentId: string;
  onSelectAgent: (id: string) => void;
  jobs: VibeAgentJobSummary[];
  jobTitles: Record<string, string>;
  isLoadingJobs: boolean;
  activeJobId: string | null;
  onSelectJob: (jobId: string) => void;
  onNewChat: () => void;
  projectName?: string;
  newChatDisabled?: boolean;
  newChatDisabledReason?: string;
}

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);

const ChatIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.7-3.4A7.5 7.5 0 1 1 20 11.5Z" strokeLinejoin="round" />
  </svg>
);

const RailIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
    <path d={collapsed ? "m14 9 3 3-3 3" : "m17 9-3 3 3 3"} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function timeLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function groupLabel(iso: string) {
  const day = new Date(iso);
  if (Number.isNaN(day.getTime())) return "Earlier";
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const ageDays = Math.floor((startToday - new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()) / 86400000);
  if (ageDays <= 0) return "Today";
  if (ageDays === 1) return "Yesterday";
  if (ageDays < 7) return "Previous 7 days";
  return "Earlier";
}

function stageLabel(job: VibeAgentJobSummary) {
  if (job.status === "cancelled") return "Cancelled";
  if (job.status === "completed" || job.stage >= 5) return "Export ready";
  if (job.stage === 4) return "Ready to export";
  if (job.stage === 3) return "Results enriched";
  if (job.stage === 2) return "Search complete";
  return "Search planned";
}

function conversationTitle(job: VibeAgentJobSummary, titles: Record<string, string>) {
  const title = titles[job.job_id]?.replace(/\s+/g, " ").trim();
  if (title) return title;
  if (job.template_id) return job.template_id.replace(/_/g, " ");
  return `Lead search · ${new Date(job.created_at).toLocaleDateString()}`;
}

export default function AgentsSidebar({
  agents,
  selectedAgentId,
  onSelectAgent,
  jobs,
  jobTitles,
  isLoadingJobs,
  activeJobId,
  onSelectJob,
  onNewChat,
  projectName,
  newChatDisabled = false,
  newChatDisabledReason,
}: AgentsSidebarProps) {
  const { t } = useLandingTheme();
  const [collapsed, setCollapsed] = useState(false);
  const sidebarStyle = { background: t.isDark ? "#101012" : t.card, border: `1px solid ${t.border}` };
  const groups = ["Today", "Yesterday", "Previous 7 days", "Earlier"]
    .map((label) => ({ label, jobs: jobs.filter((job) => groupLabel(job.created_at) === label) }))
    .filter((group) => group.jobs.length > 0);

  if (collapsed) {
    return (
      <aside className="hidden md:flex w-[66px] flex-none rounded-[26px] flex-col items-center gap-3 overflow-hidden py-4" style={sidebarStyle}>
        <button onClick={() => setCollapsed(false)} aria-label="Expand conversations sidebar" className="grid h-9 w-9 place-items-center rounded-xl hover:opacity-70" style={{ color: t.fgMid }}><RailIcon collapsed /></button>
        <div className="my-1 w-7" style={{ borderTop: `1px solid ${t.border}` }} />
        {agents.map((agent) => (
          <button key={agent.id} onClick={() => onSelectAgent(agent.id)} title={agent.name} className="relative h-10 w-10 overflow-hidden rounded-xl" style={{ outline: selectedAgentId === agent.id ? `1px solid ${t.gold}` : "none" }}>
            <Image src={agent.logo} alt={agent.name} fill sizes="40px" className="object-cover" />
          </button>
        ))}
        <button onClick={onNewChat} disabled={newChatDisabled} title={newChatDisabled ? newChatDisabledReason : "New chat"} aria-label="New chat" className="grid h-10 w-10 place-items-center rounded-xl disabled:opacity-40" style={{ color: t.gold, background: t.goldDim, border: `1px solid ${t.gold}` }}><PlusIcon /></button>
        <span className="mt-auto text-[10px] font-semibold" style={{ color: t.fgFaint }}>{jobs.length}</span>
      </aside>
    );
  }

  return (
    <aside className="hidden md:flex w-[252px] lg:w-[270px] flex-none rounded-[26px] flex-col overflow-hidden" style={sidebarStyle}>
      <div className="flex items-center justify-between px-4 pb-3 pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: t.fgFaint }}>Workspace</p>
        <button onClick={() => setCollapsed(true)} aria-label="Collapse conversations sidebar" className="grid h-7 w-7 place-items-center rounded-lg hover:opacity-70" style={{ color: t.fgMid }}><RailIcon collapsed={false} /></button>
      </div>

      <div className="px-3">
        {agents.map((agent) => {
          const active = agent.id === selectedAgentId;
          return (
            <button key={agent.id} onClick={() => onSelectAgent(agent.id)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors" style={{ background: active ? t.goldDim : "transparent", border: `1px solid ${active ? t.goldDim : "transparent"}` }}>
              <span className="relative h-10 w-10 flex-none overflow-hidden rounded-xl"><Image src={agent.logo} alt="" fill sizes="40px" className="object-cover" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold" style={{ color: active ? t.gold : t.fg }}>{agent.name}</span>
                <span className="mt-0.5 block truncate text-[10px]" style={{ color: t.fgMid }}>{agent.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="px-3 pt-5">
        <button onClick={onNewChat} disabled={newChatDisabled} title={newChatDisabled ? newChatDisabledReason : undefined} className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition-colors hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40" style={{ background: t.goldDim, color: t.gold, border: `1px solid ${t.gold}` }}><PlusIcon />New chat</button>
        {newChatDisabled && newChatDisabledReason && <p className="mt-2 text-[10px] leading-relaxed" style={{ color: t.fgFaint }}>{newChatDisabledReason}</p>}
      </div>

      <div className="mx-4 mt-6" style={{ borderTop: `1px solid ${t.border}` }} />
      <div className="flex items-center justify-between px-5 pb-1 pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.17em]" style={{ color: t.fgFaint }}>Conversations</p>
        <span className="rounded-md px-1.5 py-0.5 text-[10px]" style={{ color: t.fgMid, background: t.isDark ? "#242426" : t.surface }}>{jobs.length}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {isLoadingJobs ? <p className="px-3 py-4 text-[11px]" style={{ color: t.fgMid }}>Loading conversations…</p> : jobs.length === 0 ? (
          <div className="mx-2 mt-4 rounded-2xl px-3 py-4" style={{ background: t.isDark ? "#19191b" : t.surface, border: `1px dashed ${t.border}` }}>
            <span className="mb-2 block" style={{ color: t.gold }}><ChatIcon /></span>
            <p className="text-[11px] font-medium" style={{ color: t.fg }}>Your searches will appear here</p>
            <p className="mt-1 text-[10px] leading-relaxed" style={{ color: t.fgMid }}>Start a chat to build your first lead list.</p>
          </div>
        ) : groups.map((group) => (
          <div key={group.label} className="pt-3">
            <p className="px-3 pb-2 text-[10px] font-medium" style={{ color: t.fgFaint }}>{group.label}</p>
            <div className="space-y-1">
              {group.jobs.map((job) => {
                const active = job.job_id === activeJobId;
                return (
                  <button key={job.job_id} onClick={() => onSelectJob(job.job_id)} title={conversationTitle(job, jobTitles)} aria-current={active ? "page" : undefined} className="group flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:brightness-125" style={{ background: active ? t.goldDim : "transparent", border: `1px solid ${active ? t.goldDim : "transparent"}` }}>
                    <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-lg" style={{ color: active ? t.gold : t.fgMid, background: active ? t.isDark ? "#2c261c" : t.surface : t.isDark ? "#202023" : t.surface }}><ChatIcon /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-medium" style={{ color: active ? t.gold : t.fg }}>{conversationTitle(job, jobTitles)}</span>
                      <span className="mt-1 flex items-center gap-1.5 text-[10px]" style={{ color: t.fgMid }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: job.status === "completed" ? "#5ad5b0" : job.status === "cancelled" ? t.fgFaint : t.gold }} />
                        <span className="truncate">{stageLabel(job)}</span><span>·</span><span className="flex-none" suppressHydrationWarning>{timeLabel(job.created_at)}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t px-4 py-3" style={{ borderColor: t.border }}>
        <p className="truncate text-[10px]" style={{ color: t.fgFaint }}>Project <span style={{ color: t.fgMid }}>{projectName || "Select a project"}</span></p>
      </div>
    </aside>
  );
}
