"use client";

import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import type { VibeAgentJobSummary } from "@/lib/api/vibeProspectingAgentStream";

export interface AgentDef {
  id: string;
  name: string;
  description: string;
  logo: StaticImageData;
}

const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CollapseIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

function relativeTime(iso: string | null) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function jobStatusDot(status: VibeAgentJobSummary["status"]) {
  if (status === "completed") return "bg-emerald-500";
  if (status === "cancelled") return "bg-gray-600";
  return "bg-[var(--gold-primary)]";
}

interface AgentsSidebarProps {
  agents: AgentDef[];
  selectedAgentId: string;
  onSelectAgent: (id: string) => void;
  jobs: VibeAgentJobSummary[];
  isLoadingJobs: boolean;
  activeJobId: string | null;
  onSelectJob: (jobId: string) => void;
  onNewChat: () => void;
  /** Agent ids that already have at least one job for the current project —
   *  shown with a gold dot badge so it's visible at a glance that this
   *  agent is already "in use" here (see newChatDisabled below). */
  agentsInUse?: string[];
  /** Disables "New chat" — this project's single Vibe Prospecting session
   *  already exists or has already delivered its export, so a second one
   *  can't be started here; the user has to switch projects instead. */
  newChatDisabled?: boolean;
  newChatDisabledReason?: string;
}

// Left-hand vertical navbar for the Agents screen — mirrors Claude web's
// sidebar (pick a "thing" up top, conversation history below it) instead of
// the app's usual single top pill navbar, since this screen has its own
// two-pane layout. Kept as its own opaque card (same rounded-3xl/#0f0f0f
// convention as every other dashboard card) rather than a portal/drawer —
// it's a permanent part of this screen's layout, not an overlay.
//
// Collapse state is local to this component (not lifted to page.tsx) since
// nothing outside the sidebar needs to know about it — collapsing only
// narrows this card's own width and swaps its content to an icon-only rail,
// same as Claude web's own collapsible sidebar.
export default function AgentsSidebar({
  agents,
  selectedAgentId,
  onSelectAgent,
  jobs,
  isLoadingJobs,
  activeJobId,
  onSelectJob,
  onNewChat,
  agentsInUse = [],
  newChatDisabled = false,
  newChatDisabledReason,
}: AgentsSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <aside className="w-16 flex-none border border-[#1c1c1c] bg-[#0f0f0f] rounded-3xl flex flex-col items-center overflow-hidden py-3 gap-3">
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand sidebar"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-[#918C94] hover:text-[var(--gold-primary)] hover:bg-white/5 transition-colors flex-none"
        >
          <CollapseIcon collapsed={collapsed} />
        </button>

        <div className="w-full px-2 flex flex-col gap-1.5">
          {agents.map((agent) => {
            const active = agent.id === selectedAgentId;
            const inUse = agentsInUse.includes(agent.id);
            return (
              <button
                key={agent.id}
                onClick={() => onSelectAgent(agent.id)}
                title={inUse ? `${agent.name} (already in use for this project)` : agent.name}
                className={`w-full flex items-center justify-center py-1.5 rounded-xl transition-colors ${
                  active ? "bg-[rgba(204,172,93,0.12)]" : "hover:bg-white/5"
                }`}
              >
                <div className="relative w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-none overflow-hidden">
                  <Image src={agent.logo} alt="" width={20} height={20} className="object-contain" />
                  {inUse && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--gold-primary)] border-2 border-[#0f0f0f]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={onNewChat}
          title={newChatDisabled ? newChatDisabledReason || "Already in use for this project" : "New chat"}
          disabled={newChatDisabled}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--gold-primary)] text-black hover:brightness-110 transition-all flex-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
        >
          <PlusIcon />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-[280px] flex-none border border-[#1c1c1c] bg-[#0f0f0f] rounded-3xl flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-[#1c1c1c] flex-none flex items-center justify-between">
        <p className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-gray-600">Agents</p>
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse sidebar"
          className="w-6 h-6 flex items-center justify-center rounded-md text-[#918C94] hover:text-[var(--gold-primary)] hover:bg-white/5 transition-colors"
        >
          <CollapseIcon collapsed={collapsed} />
        </button>
      </div>

      <div className="px-3 pt-3 flex-none">
        {agents.map((agent) => {
          const active = agent.id === selectedAgentId;
          const inUse = agentsInUse.includes(agent.id);
          return (
            <button
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              className={`w-full flex items-center gap-2.5 text-left px-2.5 py-2.5 rounded-xl transition-colors ${
                active ? "bg-[rgba(204,172,93,0.12)]" : "hover:bg-white/5"
              }`}
            >
              <div className="relative w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-none overflow-hidden">
                <Image src={agent.logo} alt="" width={20} height={20} className="object-contain" />
                {inUse && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--gold-primary)] border-2 border-[#0f0f0f]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className={`text-xs font-semibold truncate ${active ? "text-[var(--gold-primary)]" : "text-white"}`}>
                    {agent.name}
                  </p>
                  {inUse && (
                    <span className="flex-none px-1.5 py-0.5 rounded-full text-[9px] font-semibold text-[var(--gold-primary)]" style={{ background: "rgba(204,172,93,0.15)" }}>
                      In use
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-gray-600 truncate">{agent.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="px-3 pt-4 flex-none">
        <button
          onClick={onNewChat}
          disabled={newChatDisabled}
          title={newChatDisabled ? newChatDisabledReason : undefined}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-[var(--gold-primary)] text-black hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
        >
          <PlusIcon />
          New chat
        </button>
        {newChatDisabled && newChatDisabledReason && (
          <p className="text-[10px] text-gray-600 mt-1.5 leading-relaxed">{newChatDisabledReason}</p>
        )}
      </div>

      <div className="px-4 pt-4 pb-1.5 flex-none">
        <p className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-gray-600">Recent</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3">
        {isLoadingJobs ? (
          <p className="px-2.5 py-2 text-[11px] text-gray-600">Loading…</p>
        ) : jobs.length === 0 ? (
          <p className="px-2.5 py-2 text-[11px] text-gray-600">No conversations yet.</p>
        ) : (
          jobs.map((job) => {
            const active = job.job_id === activeJobId;
            const label = job.template_id ? job.template_id.replace(/_/g, " ") : "Conversation";
            return (
              <button
                key={job.job_id}
                onClick={() => onSelectJob(job.job_id)}
                className={`w-full flex items-start gap-2 text-left px-2.5 py-2 rounded-lg transition-colors ${
                  active ? "bg-[rgba(204,172,93,0.12)] text-[var(--gold-primary)]" : "text-[#c9c2ae] hover:bg-white/5"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-none ${jobStatusDot(job.status)}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11.5px] font-medium truncate capitalize">{label}</span>
                  <span className="block text-[10px] text-gray-600">{relativeTime(job.created_at)}</span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
