// Create-project endpoint — a single-purpose Lambda behind Authorization:
// Bearer <accessToken>, same NDJSON step/result wire format as the rest
// (response-streaming API Gateway integration, 900000ms timeout — this call
// crawls up to 5 pages of the given website, generates ICP/competitors via
// NVIDIA, computes heuristic lighthouse metrics, and syncs a distilled
// business-profile document into the Bedrock knowledge base, so it commonly
// takes 60-150s+ end to end).
import type { ProjectRecord } from "@/redux/services/auth/auth";

const CREATE_PROJECT_API_URL =
  "https://q1qhgitk2a.execute-api.us-east-1.amazonaws.com/dev/xlya-dev-users-create-project-api";

export interface CreateProjectStepEvent {
  type: "step";
  step: string;
  parent: string | null;
  status: "started" | "completed" | "failed";
  label: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface CreateProjectResultEvent {
  type: "result";
  statusCode: number;
  message?: string;
  error?: string;
  details?: string[];
  project?: ProjectRecord;
}

export type CreateProjectStreamEvent = CreateProjectStepEvent | CreateProjectResultEvent;

const INACTIVITY_TIMEOUT_MS = 60000;

export async function streamCreateProject(
  accessToken: string,
  websiteUrl: string,
  onEvent: (event: CreateProjectStreamEvent) => void
): Promise<void> {
  const controller = new AbortController();

  const response = await fetch(CREATE_PROJECT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ websiteUrl }),
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
