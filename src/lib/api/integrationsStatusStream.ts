// Shared integrations connection-status endpoint — Authorization: Bearer
// <accessToken>, same NDJSON step/result wire format as the rest. Given a
// project_id, reports whether each known integration (Vibe Prospecting today,
// more added later without any frontend contract change) is connected for
// that project. This lambda only reads status — connect/disconnect for each
// integration stays owned by that integration's own lambda (see
// vibeProspectingStream.ts).
export type IntegrationConnectionStatus = "connected" | "connecting" | "disconnected";

export interface IntegrationStatus {
  id: string;
  name: string;
  connection_status: IntegrationConnectionStatus;
  connected_at: string | null;
  updated_at: string | null;
}

export interface IntegrationsStatusStepEvent {
  type: "step";
  step: string;
  parent: string | null;
  status: "started" | "completed" | "failed";
  label: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface IntegrationsStatusResultEvent {
  type: "result";
  statusCode: number;
  error?: string;
  details?: string[];
  integrations?: IntegrationStatus[];
}

export type IntegrationsStatusStreamEvent = IntegrationsStatusStepEvent | IntegrationsStatusResultEvent;

const INTEGRATIONS_STATUS_API_URL =
  "https://q1qhgitk2a.execute-api.us-east-1.amazonaws.com/dev/xlya-dev-users-integrations-connection-status-api";

const INACTIVITY_TIMEOUT_MS = 20000;

export async function streamIntegrationsStatus(
  accessToken: string,
  projectId: string,
  onEvent: (event: IntegrationsStatusStreamEvent) => void
): Promise<void> {
  const controller = new AbortController();

  const response = await fetch(INTEGRATIONS_STATUS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ project_id: projectId }),
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
