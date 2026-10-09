import type { VibeAgentStepEvent } from "./vibeProspectingAgentStream";

export interface VibeAgentProgress {
  label: string;
  status: VibeAgentStepEvent["status"];
  heartbeats: number;
  step: string;
}

export function startingAgentProgress(label: string): VibeAgentProgress {
  return { label, status: "started", heartbeats: 0, step: "client:start" };
}

export function updateVibeAgentProgress(current: VibeAgentProgress | null, event: VibeAgentStepEvent): VibeAgentProgress {
  const step = `${event.parent ?? "root"}:${event.step}`;
  return {
    step,
    label: event.error ? `${event.label}: ${event.error}` : event.label,
    status: event.status,
    heartbeats: current?.step === step && current.status === "started" && event.status === "started"
      ? current.heartbeats + 1
      : 0,
  };
}
