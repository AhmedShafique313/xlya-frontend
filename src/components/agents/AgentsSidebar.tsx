"use client";

import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import type { VibeAgentJobSummary } from "@/lib/api/vibeProspectingAgentStream";
import { useLandingTheme } from "@/components/landingPage/landingTheme";

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

function jobStatusColor(status: VibeAgentJobSummary["status"], gold: string) {
  if (status === "completed") return "#10b981";
  if (status === "cancelled") return "#6b7280";
  return gold;
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
// two-pane layout. Kept as its own opaque card (same rounded-3xl convention
// as every other dashboard card) rather than a portal/drawer — it's a
// permanent part of this screen's layout, not an overlay.
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
  const { t } = useLandingTheme();
  const [collapsed, setCollapsed] = useState(false);

  const cardStyle: React.CSSProperties = { border: `1px solid ${t.border}`, background: t.card };
  const railBtnStyle = (active: boolean): React.CSSProperties => ({ background: active ? t.stepActiveBg : "transparent" });
  const ctaStyle: React.CSSProperties = { background: t.gold, color: t.isDark ? "#0a0a0a" : "#faf8f4" };

  if (collapsed) {
    return (
      <aside className="w-16 flex-none rounded-3xl flex flex-col items-center overflow-hidden py-3 gap-3" style={cardStyle}>
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand sidebar"
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors flex-none"
          style={{ color: t.fgMid }}
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
                className="w-full flex items-center justify-center py-1.5 rounded-xl transition-colors"
                style={railBtnStyle(active)}
              >
                <div className="relative w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-none overflow-hidden">
                  <Image src={agent.logo} alt="" width={20} height={20} className="object-contain" />
                  {inUse && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ background: t.gold, borderColor: t.card }} />
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
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:brightness-110 transition-all flex-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
          style={ctaStyle}
        >
          <PlusIcon />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-[280px] flex-none rounded-3xl flex flex-col overflow-hidden" style={cardStyle}>
      <div className="px-4 pt-4 pb-3 flex-none flex items-center justify-between" style={{ borderBottom: `1px solid ${t.border}` }}>
        <p className="text-[10.5px] font-semibold tracking-[0.06em] uppercase" style={{ color: t.fgFaint }}>Agents</p>
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse sidebar"
          className="w-6 h-6 flex items-center justify-center rounded-md transition-colors"
          style={{ color: t.fgMid }}
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
              className="w-full flex items-center gap-2.5 text-left px-2.5 py-2.5 rounded-xl transition-colors"
              style={railBtnStyle(active)}
            >
              <div className="relative w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-none overflow-hidden">
                <Image src={agent.logo} alt="" width={20} height={20} className="object-contain" />
                {inUse && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ background: t.gold, borderColor: t.card }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold truncate" style={{ color: active ? t.gold : t.fg }}>
                    {agent.name}
                  </p>
                  {inUse && (
                    <span className="flex-none px-1.5 py-0.5 rounded-full text-[9px] font-semibold" style={{ color: t.gold, background: t.goldDim }}>
                      In use
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] truncate" style={{ color: t.fgFaint }}>{agent.description}</p>
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
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
          style={ctaStyle}
        >
          <PlusIcon />
          New chat
        </button>
        {newChatDisabled && newChatDisabledReason && (
          <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: t.fgFaint }}>{newChatDisabledReason}</p>
        )}
      </div>

      <div className="px-4 pt-4 pb-1.5 flex-none">
        <p className="text-[10.5px] font-semibold tracking-[0.06em] uppercase" style={{ color: t.fgFaint }}>Recent</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3">
        {isLoadingJobs ? (
          <p className="px-2.5 py-2 text-[11px]" style={{ color: t.fgFaint }}>Loading…</p>
        ) : jobs.length === 0 ? (
          <p className="px-2.5 py-2 text-[11px]" style={{ color: t.fgFaint }}>No conversations yet.</p>
        ) : (
          jobs.map((job) => {
            const active = job.job_id === activeJobId;
            const label = job.template_id ? job.template_id.replace(/_/g, " ") : "Conversation";
            return (
              <button
                key={job.job_id}
                onClick={() => onSelectJob(job.job_id)}
                className="w-full flex items-start gap-2 text-left px-2.5 py-2 rounded-lg transition-colors"
                style={{ background: active ? t.stepActiveBg : "transparent", color: active ? t.gold : t.fgMid }}
              >
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-none" style={{ background: jobStatusColor(job.status, t.gold) }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11.5px] font-medium truncate capitalize">{label}</span>
                  <span className="block text-[10px]" style={{ color: t.fgFaint }}>{relativeTime(job.created_at)}</span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
