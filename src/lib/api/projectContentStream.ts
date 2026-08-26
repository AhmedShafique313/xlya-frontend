// Project content endpoint (description + knowledge-base documents) — a
// single action-dispatch Lambda behind Authorization: Bearer <accessToken>,
// hit directly via its Function URL (not the shared API Gateway — this
// Lambda has no Gateway route). Streams progress as NDJSON, same wire
// format/client shape as settingsStream.ts/signupStream.ts.
//
// Every mutating action blocks on a real Bedrock knowledge-base ingestion
// sync server-side before returning — observed taking ~90-100s live against
// the real KB, driven by periodic "Syncing knowledge base…" step heartbeats
// roughly every 4s. INACTIVITY_TIMEOUT_MS only needs to cover the gap
// *between* those heartbeats, not the total duration, but is set generously
// above that cadence for real-world margin.
const PROJECT_CONTENT_API_URL = "https://x24enrxyndfy42zxxljpkdkfta0zcqvf.lambda-url.us-east-1.on.aws/";

export type ProjectContentAction =
  | "get"
  | "add_description"
  | "add_file"
  | "delete_document"
  | "delete_description"
  | "delete_project";

export interface ProjectContentStepEvent {
  type: "step";
  step: string;
  parent: string | null;
  status: "started" | "completed" | "failed";
  label: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface ProjectDocument {
  document_id: string;
  s3_key: string;
  name: string;
  ext: string;
  sizeLabel: string;
  addedLabel: string | null;
}

export interface ProjectContentResultEvent {
  type: "result";
  statusCode: number;
  message?: string;
  error?: string;
  details?: string[];
  description?: string;
  documents?: ProjectDocument[];
  document?: ProjectDocument;
  kbSyncWarning?: string;
}

export type ProjectContentStreamEvent = ProjectContentStepEvent | ProjectContentResultEvent;

const CONNECT_TIMEOUT_MS = 30000;
const INACTIVITY_TIMEOUT_MS = 60000;

async function readNdjsonStream(
  response: Response,
  onEvent: (event: ProjectContentStreamEvent) => void,
  controller: AbortController
): Promise<void> {
  if (!response.body) throw new Error("Request failed");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let resultReceived = false;

  const handleLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let parsed: ProjectContentStreamEvent;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      console.error("projectContentStream: skipping malformed NDJSON line", trimmed);
      return;
    }
    if (parsed.type === "result") resultReceived = true;
    onEvent(parsed);
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

  if (!resultReceived) {
    throw new Error("Connection closed before completing. Please try again.");
  }
}

async function fetchWithConnectTimeout(input: string, init: RequestInit, controller: AbortController): Promise<Response> {
  const connectTimeoutId = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
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
    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Could not reach the server. Please check your connection and try again.");
    }
    throw err;
  } finally {
    clearTimeout(connectTimeoutId);
  }
}

export async function streamProjectContent(
  accessToken: string,
  body: { action: ProjectContentAction; project_id: string; [key: string]: unknown },
  onEvent: (event: ProjectContentStreamEvent) => void
): Promise<void> {
  const controller = new AbortController();
  const response = await fetchWithConnectTimeout(
    PROJECT_CONTENT_API_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(body),
    },
    controller
  );
  await readNdjsonStream(response, onEvent, controller);
}

// add_file is the one action that sends multipart/form-data (raw file
// bytes) instead of JSON — everything else about the stream is identical.
export async function streamAddFile(
  accessToken: string,
  projectId: string,
  file: File,
  onEvent: (event: ProjectContentStreamEvent) => void
): Promise<void> {
  const formData = new FormData();
  formData.append("action", "add_file");
  formData.append("project_id", projectId);
  formData.append("file", file);

  const controller = new AbortController();
  const response = await fetchWithConnectTimeout(
    PROJECT_CONTENT_API_URL,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    },
    controller
  );
  await readNdjsonStream(response, onEvent, controller);
}
