// Login endpoint. Streams progress as NDJSON (Content-Type: application/x-ndjson,
// Transfer-Encoding: chunked — one bare JSON object per line, NOT Server-Sent
// Events) — same wire format as signupStream.ts, since this Lambda is behind
// an identically-configured response-streaming API Gateway integration.
import type { ProjectRecord } from "@/redux/services/auth/auth";

const LOGIN_API_URL =
  "https://q1qhgitk2a.execute-api.us-east-1.amazonaws.com/dev/xlya-dev-users-login-api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginStreamStepEvent {
  type: "step";
  step: string;
  parent: string | null;
  status: "started" | "completed" | "failed";
  label: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface LoginStreamResultEvent {
  type: "result";
  statusCode: number;
  // Success responses use "message"; error responses (401 wrong password,
  // 404 no such account, 403 unconfirmed, etc.) use "error" instead and
  // omit tokens/sub/project.
  message?: string;
  error?: string;
  tokens?: {
    accessToken: string;
    idToken: string;
    refreshToken: string;
  };
  sub?: string;
  project?: ProjectRecord | null;
}

export type LoginStreamEvent = LoginStreamStepEvent | LoginStreamResultEvent;

// Thrown when the stream's final "result" event reports a non-200 outcome
// (e.g. 404 no such account, 401 wrong password) — carries the statusCode so
// callers can branch on it instead of matching against the error message text.
export class LoginApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "LoginApiError";
    this.statusCode = statusCode;
  }
}

// API Gateway's Lambda-proxy integration hard-kills connections at 29s, so a
// stall this long usually means that already happened.
const INACTIVITY_TIMEOUT_MS = 35000;

export async function streamLogin(
  payload: LoginPayload,
  onEvent: (event: LoginStreamEvent) => void
): Promise<void> {
  const controller = new AbortController();

  const response = await fetch(LOGIN_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: controller.signal,
  });

  if (!response.ok || !response.body) {
    let message = "Login failed";
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
      throw new Error("Login is taking longer than expected. Please try again.");
    }
    throw err;
  }

  if (buffer.trim()) handleLine(buffer);
}
