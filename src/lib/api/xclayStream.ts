const XCLAY_URL = "https://psbt4xfk5ukpdl7tw265hfj2ta0fhqog.lambda-url.us-east-1.on.aws/";

export type XclayEvent =
  | { type: "step"; step: string; label: string; status: "started" | "completed" | "failed"; error?: string }
  | { type: "message_delta"; text: string }
  | { type: "result"; statusCode: number; values?: Record<string, string>; incompleteColumns?: string[]; sources?: { title: string; url: string }[]; error?: string };

export class XclayError extends Error {
  constructor(message: string, public sources: { title: string; url: string }[] = []) {
    super(message);
  }
}

export async function streamXclayRow(
  accessToken: string,
  payload: { project_id: string; row: Record<string, string>; instruction: string; outputColumns: string[] },
  onEvent: (event: XclayEvent) => void,
  signal?: AbortSignal,
): Promise<{ values: Record<string, string>; incompleteColumns: string[]; sources: { title: string; url: string }[] }> {
  const response = await fetch(XCLAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ action: "enrich", schemaVersion: 1, ...payload }),
    signal,
  });
  if (!response.ok || !response.body) throw new Error(`Xclay could not connect (${response.status}).`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: Extract<XclayEvent, { type: "result" }> | null = null;
  const consume = (line: string) => {
    if (!line.trim()) return;
    let event: XclayEvent;
    try { event = JSON.parse(line) as XclayEvent; }
    catch { throw new Error("Xclay returned malformed streaming data."); }
    onEvent(event);
    if (event.type === "result") result = event;
  };
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    lines.forEach(consume);
  }
  buffer += decoder.decode();
  if (buffer.trim()) consume(buffer);
  const finalResult = result as Extract<XclayEvent, { type: "result" }> | null;
  if (!finalResult) throw new Error("Xclay closed before sending a final result.");
  if (finalResult.statusCode !== 200 || !finalResult.values) throw new XclayError(finalResult.error || "Xclay could not enrich this row.", finalResult.sources || []);
  return { values: finalResult.values, incompleteColumns: finalResult.incompleteColumns || [], sources: finalResult.sources || [] };
}
