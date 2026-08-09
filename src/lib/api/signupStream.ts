// Single combined signup + onboarding endpoint. Streams progress as
// NDJSON (Content-Type: application/x-ndjson, Transfer-Encoding: chunked —
// one bare JSON object per line, NOT Server-Sent Events) while it creates
// the Cognito user, confirms it, signs it in, saves onboarding answers, and
// provisions the project — then emits one final "result" event carrying
// the session tokens.
const SIGNUP_ONBOARDING_API_URL =
  "https://q1qhgitk2a.execute-api.us-east-1.amazonaws.com/dev/xlya-dev-users-signup-api";

export interface SignupOnboardingPayload {
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  password: string;
  businessType?: string;
  challenge?: string;
  teamSize?: string;
  websiteUrl?: string;
}

export interface SignupStreamStepEvent {
  type: "step";
  step: string;
  parent: string | null;
  // A step can fail (e.g. rate-limited enrichment calls) without the overall
  // signup failing — the backend keeps going and the final "result" event is
  // still the source of truth for success/failure.
  status: "started" | "completed" | "failed";
  label: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface SignupStreamResultEvent {
  type: "result";
  statusCode: number;
  // Success responses use "message"; error responses (e.g. 409 duplicate
  // email, 400 validation) use "error" instead and omit tokens/sub/project.
  // Validation errors additionally carry "details" — the specific field
  // messages, more useful to show than the generic "error" string.
  message?: string;
  error?: string;
  details?: string[];
  tokens?: {
    accessToken: string;
    idToken: string;
    refreshToken: string;
  };
  sub?: string;
  project?: {
    project_id?: string;
    project_name?: string;
    website_url?: string;
    created_at?: string;
  };
}

export type SignupStreamEvent = SignupStreamStepEvent | SignupStreamResultEvent;

// Thrown when the stream's final "result" event reports a non-200 outcome
// (e.g. 409 duplicate email) — carries the statusCode so callers can branch
// on it instead of matching against the error message text.
export class SignupApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "SignupApiError";
    this.statusCode = statusCode;
  }
}

// This module only delivers events as fast as they truly arrive on the
// wire — pacing the *visual* reveal at a legible speed (independent of how
// bursty the actual network delivery is) is the UI layer's job, not the
// transport's, so it can target a fixed total animation length regardless
// of how many steps come back.

// How long we'll wait with no new bytes on the wire before giving up. API
// Gateway's Lambda-proxy integration hard-kills connections at 29s, so a
// stall usually means that already happened; this turns a silent infinite
// hang into a recoverable error instead of a permanently frozen screen.
const INACTIVITY_TIMEOUT_MS = 35000;

export async function streamSignup(
  payload: SignupOnboardingPayload,
  onEvent: (event: SignupStreamEvent) => void
): Promise<void> {
  const controller = new AbortController();

  const response = await fetch(SIGNUP_ONBOARDING_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: controller.signal,
  });

  if (!response.ok || !response.body) {
    let message = "Signup failed";
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
      throw new Error("Signup is taking longer than expected. Please try again.");
    }
    throw err;
  }

  if (buffer.trim()) handleLine(buffer);
}
