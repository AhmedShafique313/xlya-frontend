// Vibe Prospecting chat/agent Lambda — a Lambda Function URL (RESPONSE_STREAM,
// AuthType NONE), not an API Gateway route like the rest of the *Stream.ts
// clients, but the same NDJSON step/result wire convention plus one extra
// event shape: {type:"message", role:"assistant", text} for an
// intermediate assistant reply. The lambda always sends the same reply text
// via BOTH a "message" event and the final "result" event's `reply` field
// except on cancel/export (no "message" event there) — this client only
// reads `reply`/`download_url` off the "result" event to avoid double-adding
// the same bubble; callers should ignore "message" events unless a live
// typing indicator is wanted, since it carries no information the result
// event lacks.
export interface VibeAgentStepEvent {
  type: "step";
  step: string;
  parent: string | null;
  status: "started" | "completed" | "failed";
  label: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface VibeAgentMessageEvent {
  type: "message";
  role: "assistant";
  text: string;
}

export interface VibeAgentTemplate {
  id: string;
  label: string;
  prompt: string;
}

export interface VibeAgentProjectContext {
  project_name: string;
  description: string | null;
  icp: unknown;
  competitors: unknown;
}

export interface VibeAgentJobSummary {
  job_id: string;
  stage: number;
  template_id: string | null;
  status: "active" | "cancelled" | "completed";
  created_at: string;
  s3_key: string | null;
}

export interface VibeAgentChatMessage {
  role: "user" | "assistant";
  text: string;
  created_at: string;
}

export interface VibeAgentResultEvent {
  type: "result";
  statusCode: number;
  error?: string;
  details?: string[];
  // welcome
  project_context?: VibeAgentProjectContext;
  templates?: VibeAgentTemplate[];
  // get_job
  job_id?: string;
  stage?: number;
  messages?: VibeAgentChatMessage[];
  status?: "active" | "cancelled" | "completed";
  s3_key?: string | null;
  // list_jobs
  jobs?: VibeAgentJobSummary[];
  // chat / run_template
  reply?: string;
  awaiting_confirmation?: boolean;
  download_url?: string;
  row_count?: number;
}

export type VibeAgentStreamEvent = VibeAgentStepEvent | VibeAgentMessageEvent | VibeAgentResultEvent;

export interface VibeAgentPayload {
  action: "welcome" | "get_job" | "list_jobs" | "chat" | "run_template";
  project_id: string;
  job_id?: string;
  message?: string;
  template_id?: string;
}

const VIBE_PROSPECTING_AGENT_URL = "https://5b225ofw4osgzulhiagjj2zdjm0kmlmz.lambda-url.us-east-1.on.aws/";

// Individual stages can involve an MCP round trip plus an NVIDIA call
// (~30s timeout each) before the next step event is written, so this needs a
// wider inactivity window than the other *Stream.ts clients' 20-30s.
const INACTIVITY_TIMEOUT_MS = 60000;

export async function streamVibeProspectingAgent(
  accessToken: string,
  payload: VibeAgentPayload,
  onEvent: (event: VibeAgentStreamEvent) => void
): Promise<void> {
  const controller = new AbortController();

  const response = await fetch(VIBE_PROSPECTING_AGENT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  });

  if (!response.ok || !response.body) {
    let msg = "Request failed";
    try {
      const errJson = await response.json();
      msg = errJson?.message || errJson?.error || msg;
    } catch {
      // non-JSON error body — keep the default message
    }
    throw new Error(msg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const handleLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      onEvent(JSON.parse(trimmed));
    } catch {
      // malformed line — skip it
    }
  };

  const readWithTimeout = async () => {
    const timeoutId = setTimeout(() => controller.abort(), INACTIVITY_TIMEOUT_MS);
    try {
      return await reader.read();
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    while (true) {
      const { done, value } = await readWithTimeout();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      lines.forEach(handleLine);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("This is taking longer than expected. Please try again.");
    }
    throw err;
  }

  if (buffer.trim()) handleLine(buffer);
}
