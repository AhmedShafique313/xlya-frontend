// Vibe Prospecting MCP connector endpoint — Authorization: Bearer <accessToken>,
// same NDJSON step/result wire format as the rest (response-streaming API
// Gateway integration, 900000ms timeout). Action-dispatched: "status" (read
// current connection state), "connect" (starts the OAuth 2.1 + PKCE flow,
// returns an authorize_url to redirect the browser to), "callback" (exchanges
// the authorization code returned to /dashboard/mcp/callback), "disconnect"
// (revokes + clears the stored tokens).
export type VibeProspectingConnectionStatus = "connected" | "connecting" | "disconnected";

export interface VibeProspectingStepEvent {
  type: "step";
  step: string;
  parent: string | null;
  status: "started" | "completed" | "failed";
  label: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface VibeProspectingResultEvent {
  type: "result";
  statusCode: number;
  error?: string;
  details?: string[];
  connection_status?: VibeProspectingConnectionStatus;
  authorize_url?: string;
  connected_at?: string | null;
  updated_at?: string | null;
}

export type VibeProspectingStreamEvent = VibeProspectingStepEvent | VibeProspectingResultEvent;

export interface VibeProspectingPayload {
  action: "status" | "connect" | "callback" | "disconnect";
  project_id: string;
  code?: string;
  state?: string;
}

const VIBE_PROSPECTING_API_URL =
  "https://q1qhgitk2a.execute-api.us-east-1.amazonaws.com/dev/xlya-dev-users-vibe-prospecting-oauth-api";

const INACTIVITY_TIMEOUT_MS = 30000;

export async function streamVibeProspecting(
  accessToken: string,
  payload: VibeProspectingPayload,
  onEvent: (event: VibeProspectingStreamEvent) => void
): Promise<void> {
  const controller = new AbortController();

  const response = await fetch(VIBE_PROSPECTING_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  });

  if (!response.ok || !response.body) {
    let message = "Request failed";
    try {
      const errJson = await response.json();
      message = errJson?.message || errJson?.error || message;
    } catch {
      // non-JSON error body — keep the default message
    }
    throw new Error(message);
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
