// Settings/profile endpoint — a single action-dispatch Lambda behind
// Authorization: Bearer <accessToken>. Streams progress as NDJSON
// (Content-Type: application/x-ndjson, one bare JSON object per line, NOT
// Server-Sent Events), same wire format/client shape as
// logoutStream.ts/loginStream.ts/emailVerificationStream.ts, since this
// Lambda is behind an identically-configured response-streaming API Gateway
// integration.
const SETTINGS_API_URL =
  "https://q1qhgitk2a.execute-api.us-east-1.amazonaws.com/dev/xlya-dev-users-settings-api";

export type SettingsAction =
  | "get"
  | "update_profile"
  | "upload_image"
  | "delete_image"
  | "change_password"
  | "delete_account";

export interface SettingsStepEvent {
  type: "step";
  step: string;
  parent: string | null;
  status: "started" | "completed" | "failed";
  label: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface SettingsUser {
  sub: string;
  email: string;
  firstName?: string;
  lastName?: string;
  businessType: string | null;
  challenge: string | null;
  teamSize: string | null;
  phoneNumber: string | null;
  profileImage: string | null;
}

export interface SettingsResultEvent {
  type: "result";
  statusCode: number;
  message?: string;
  error?: string;
  details?: string[];
  user?: SettingsUser;
  profileImage?: string;
}

export type SettingsStreamEvent = SettingsStepEvent | SettingsResultEvent;

const INACTIVITY_TIMEOUT_MS = 35000;

export async function streamSettings(
  accessToken: string,
  body: { action: SettingsAction; [key: string]: unknown },
  onEvent: (event: SettingsStreamEvent) => void
): Promise<void> {
  const controller = new AbortController();

  const response = await fetch(SETTINGS_API_URL, {
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
