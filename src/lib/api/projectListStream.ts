// Project list + detail endpoint — a single action-dispatch Lambda behind
// Authorization: Bearer <accessToken>, same NDJSON step/result wire format
// as settingsStream.ts/loginStream.ts (this Lambda sits behind an
// identically-configured response-streaming API Gateway integration,
// confirmed via `aws apigateway get-integration` before writing this).
//
// "list" returns a lightweight summary per project (for the project
// switcher) — "get" returns the full row from xlya-dev-projects-table
// (icp/competitors/lighthouse_metrics/website_information included) for one
// project_id, scoped server-side to the caller's own Cognito sub.
import type { ProjectRecord, ProjectSummary } from "@/redux/services/auth/auth";

const PROJECT_LIST_API_URL =
  "https://q1qhgitk2a.execute-api.us-east-1.amazonaws.com/dev/xlya-dev-users-project-list-detail-api";

export type ProjectListAction = "list" | "get";

export interface ProjectListStepEvent {
  type: "step";
  step: string;
  parent: string | null;
  status: "started" | "completed" | "failed";
  label: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface ProjectListResultEvent {
  type: "result";
  statusCode: number;
  error?: string;
  details?: string[];
  projects?: ProjectSummary[];
  project?: ProjectRecord;
}

export type ProjectListStreamEvent = ProjectListStepEvent | ProjectListResultEvent;

const INACTIVITY_TIMEOUT_MS = 35000;

export async function streamProjectList(
  accessToken: string,
  body: { action: ProjectListAction; project_id?: string },
  onEvent: (event: ProjectListStreamEvent) => void
): Promise<void> {
  const controller = new AbortController();

  const response = await fetch(PROJECT_LIST_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
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
