// Logout endpoint — revokes the signed-in user's Cognito session
// (GlobalSignOut: invalidates the access token server-side and revokes all
// refresh tokens) given the access token as a bearer header. Streams
// progress as NDJSON (Content-Type: application/x-ndjson, Transfer-Encoding:
// chunked — one bare JSON object per line, NOT Server-Sent Events), same
// wire format as signupStream.ts/loginStream.ts/emailVerificationStream.ts,
// since this Lambda is behind an identically-configured response-streaming
// API Gateway integration.
const LOGOUT_API_URL =
  "https://q1qhgitk2a.execute-api.us-east-1.amazonaws.com/dev/xlya-dev-users-logout-api";

export interface LogoutStepEvent {
  type: "step";
  step: string;
  parent: string | null;
  status: "started" | "completed" | "failed";
  label: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface LogoutResultEvent {
  type: "result";
  statusCode: number;
  message?: string;
  error?: string;
}

export type LogoutStreamEvent = LogoutStepEvent | LogoutResultEvent;

// Thrown when the stream's final "result" event reports a non-200 outcome —
// carries the statusCode so callers can branch on it (e.g. 401 missing/bad
// token). Callers should still clear local session state on any outcome,
// since the goal is always to leave the browser logged out.
export class LogoutApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "LogoutApiError";
    this.statusCode = statusCode;
  }
}

const INACTIVITY_TIMEOUT_MS = 35000;

export async function streamLogout(
  accessToken: string,
  onEvent: (event: LogoutStreamEvent) => void
): Promise<void> {
  const controller = new AbortController();

  const response = await fetch(LOGOUT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
    signal: controller.signal,
  });

  if (!response.ok || !response.body) {
    let message = "Logout request failed";
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
      throw new Error("Logout is taking longer than expected. Please try again.");
    }
    throw err;
  }

  if (buffer.trim()) handleLine(buffer);
}
