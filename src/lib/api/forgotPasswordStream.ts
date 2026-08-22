// Forgot-password endpoint (one lambda, two actions via `action`):
// "request" — send a 6-digit reset code to the account's email (fails with
//             a clear message if the email isn't verified yet — Cognito
//             refuses to send recovery codes to unverified attributes)
// "confirm" — submit the code + new password to complete the reset; also
//             marks the email verified server-side, since receiving and
//             entering the code is equivalent proof of inbox ownership
//
// Streams progress as NDJSON (Content-Type: application/x-ndjson,
// Transfer-Encoding: chunked — one bare JSON object per line, NOT
// Server-Sent Events) — same wire format as the other auth lambdas, since
// this one is behind an identically-configured response-streaming API
// Gateway integration. No Authorization header — the user is signed out at
// this point, so this API is entirely unauthenticated (email + code prove
// identity instead).
const FORGOT_PASSWORD_API_URL =
  "https://q1qhgitk2a.execute-api.us-east-1.amazonaws.com/dev/xlya-dev-users-forgot-password-api";

export type ForgotPasswordAction = "request" | "confirm";

export interface ForgotPasswordPayload {
  action: ForgotPasswordAction;
  email: string;
  code?: string; // required for "confirm"
  newPassword?: string; // required for "confirm"
}

export interface ForgotPasswordStepEvent {
  type: "step";
  step: string;
  parent: string | null;
  status: "started" | "completed" | "failed";
  label: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface ForgotPasswordResultEvent {
  type: "result";
  statusCode: number;
  message?: string;
  error?: string;
  details?: string[];
  destination?: string | null; // "request" result — Cognito's own masked form
  emailVerified?: boolean; // "confirm" result
}

export type ForgotPasswordStreamEvent = ForgotPasswordStepEvent | ForgotPasswordResultEvent;

// Thrown when the stream's final "result" event reports a non-200 outcome —
// carries the statusCode so callers can branch on it (e.g. 404 no such
// account, 400 bad/expired code or unverified email, 429 rate limited).
export class ForgotPasswordApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ForgotPasswordApiError";
    this.statusCode = statusCode;
  }
}

const INACTIVITY_TIMEOUT_MS = 35000;

export async function streamForgotPassword(
  payload: ForgotPasswordPayload,
  onEvent: (event: ForgotPasswordStreamEvent) => void
): Promise<void> {
  const controller = new AbortController();

  const response = await fetch(FORGOT_PASSWORD_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
      throw new Error("Request is taking longer than expected. Please try again.");
    }
    throw err;
  }

  if (buffer.trim()) handleLine(buffer);
}
