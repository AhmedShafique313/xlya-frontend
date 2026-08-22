// Email verification endpoint (one lambda, three actions via `action`):
// "status" — check whether the signed-in user's email is verified
// "send"   — trigger Cognito to email a 6-digit code, via whatever email
//            provider the pool is currently configured to use
// "confirm"— submit the code to mark the email verified
//
// Streams progress as NDJSON (Content-Type: application/x-ndjson,
// Transfer-Encoding: chunked — one bare JSON object per line, NOT
// Server-Sent Events) — same wire format as signupStream.ts/loginStream.ts,
// since this Lambda is behind an identically-configured response-streaming
// API Gateway integration.
const EMAIL_VERIFICATION_API_URL =
  "https://q1qhgitk2a.execute-api.us-east-1.amazonaws.com/dev/xlya-dev-users-email-verification-api";

export type EmailVerificationAction = "status" | "send" | "confirm";

export interface EmailVerificationPayload {
  action: EmailVerificationAction;
  code?: string; // required for "confirm"
}

export interface EmailVerificationStepEvent {
  type: "step";
  step: string;
  parent: string | null;
  status: "started" | "completed" | "failed";
  label: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface EmailVerificationResultEvent {
  type: "result";
  statusCode: number;
  message?: string;
  error?: string;
  details?: string[];
  // "status" result
  emailVerified?: boolean;
  email?: string | null;
  // "send" result
  destination?: string | null; // Cognito's own masked form, e.g. "j***@example.com"
}

export type EmailVerificationStreamEvent = EmailVerificationStepEvent | EmailVerificationResultEvent;

// Thrown when the stream's final "result" event reports a non-200 outcome —
// carries the statusCode so callers can branch on it (e.g. 401 expired
// session, 400 bad/expired code, 409 already verified).
export class EmailVerificationApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "EmailVerificationApiError";
    this.statusCode = statusCode;
  }
}

const INACTIVITY_TIMEOUT_MS = 35000;

export async function streamEmailVerification(
  accessToken: string,
  payload: EmailVerificationPayload,
  onEvent: (event: EmailVerificationStreamEvent) => void
): Promise<void> {
  const controller = new AbortController();

  const response = await fetch(EMAIL_VERIFICATION_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  });

  if (!response.ok || !response.body) {
    let message = "Email verification request failed";
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
