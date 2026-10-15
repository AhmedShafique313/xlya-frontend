import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { buildMessages, buildSearchQuery, fillSocialColumns, isSocialColumn, parseAnswer, parseRequest, readSseLines, RequestError } from "./core.mjs";
import { searchWeb } from "./search.mjs";
import { companyWebsiteEvidence } from "./website.mjs";

const REGION = process.env.AWS_REGION || "us-east-1";
const PROJECTS_TABLE = process.env.PROJECTS_TABLE_NAME;
const MODEL = process.env.NVIDIA_MODEL_ID || "openai/gpt-oss-20b";
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

function emit(stream, event) { stream.write(`${JSON.stringify(event)}\n`); }
function step(stream, name, label, status, error) {
  emit(stream, { type: "step", step: name, parent: null, label, status, ...(error ? { error } : {}) });
}
function finish(stream, statusCode, fields) {
  emit(stream, { type: "result", statusCode, ...fields });
  stream.end();
}
function bearer(event) {
  const header = Object.entries(event.headers || {}).find(([key]) => key.toLowerCase() === "authorization")?.[1];
  return typeof header === "string" ? header.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() : null;
}

async function cognitoSub(token) {
  const response = await fetch(`https://cognito-idp.${REGION}.amazonaws.com/`, {
    method: "POST",
    headers: { "content-type": "application/x-amz-json-1.1", "x-amz-target": "AWSCognitoIdentityProviderService.GetUser" },
    body: JSON.stringify({ AccessToken: token }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new RequestError("Your session is invalid or expired.", 401);
  const user = await response.json();
  const sub = user.UserAttributes?.find((attribute) => attribute.Name === "sub")?.Value;
  if (!sub) throw new RequestError("Your session is invalid or expired.", 401);
  return sub;
}

async function ownedProject(sub, projectId) {
  const response = await db.send(new GetCommand({ TableName: PROJECTS_TABLE, Key: { sub, project_id: projectId } }));
  if (!response.Item) throw new RequestError("Project not found for this account.", 404);
  return response.Item;
}

async function streamModel(messages, stream) {
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "text/event-stream", authorization: `Bearer ${process.env.NVIDIA_API_KEY}` },
    body: JSON.stringify({ model: MODEL, messages, stream: true, temperature: 0.2, max_tokens: 1500 }),
    signal: AbortSignal.timeout(180_000),
  });
  if (!response.ok || !response.body) throw new RequestError(`AI provider failed (${response.status}).`, 502);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const parsed = readSseLines(buffer, decoder.decode(value, { stream: true }));
    buffer = parsed.remainder;
    for (const line of parsed.lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") continue;
      let part;
      try { part = JSON.parse(payload); } catch { continue; }
      const delta = part.choices?.[0]?.delta?.content;
      if (typeof delta === "string" && delta) {
        answer += delta;
        emit(stream, { type: "message_delta", text: delta });
      }
    }
  }
  if (buffer.trim().startsWith("data:")) {
    try { answer += JSON.parse(buffer.trim().slice(5)).choices?.[0]?.delta?.content || ""; } catch { /* final SSE sentinel */ }
  }
  if (!answer.trim()) throw new RequestError("AI provider returned an empty answer.", 502);
  return answer;
}

export const handler = awslambda.streamifyResponse(async (event, responseStream) => {
  const stream = awslambda.HttpResponseStream.from(responseStream, {
    statusCode: 200,
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
  if ((event.requestContext?.http?.method || event.httpMethod) === "OPTIONS") {
    stream.write("\n");
    stream.end();
    return;
  }
  let sources = [];
  try {
    if ((event.requestContext?.http?.method || event.httpMethod) !== "POST") throw new RequestError("Use POST for Xclay requests.", 405);
    step(stream, "authentication", "Verifying your session", "started");
    const token = bearer(event);
    if (!token) throw new RequestError("A bearer access token is required.", 401);
    const sub = await cognitoSub(token);
    step(stream, "authentication", "Verifying your session", "completed");

    const request = parseRequest(event);
    step(stream, "project", "Checking project access", "started");
    const project = await ownedProject(sub, request.projectId);
    step(stream, "project", "Checking project access", "completed");

    step(stream, "search", "Inspecting company sources", "started");
    const website = await companyWebsiteEvidence(request.row);
    sources = website.sources;
    if (!sources.some((source) => source.snippet?.length > 100)) {
      try { sources = [...sources, ...await searchWeb(buildSearchQuery(request.row, request.instruction))].slice(0, 8); }
      catch { /* A reachable company website or supplied profile can still help. */ }
    }
    if (!sources.length) throw new RequestError("No company website or reliable source was reachable for this row.", 422);
    step(stream, "search", "Inspecting company sources", "completed");

    step(stream, "research", "Researching this row", "started");
    const modelColumns = request.outputColumns.filter((column) => !isSocialColumn(column));
    const modelValues = modelColumns.length
      ? parseAnswer(await streamModel(buildMessages({ ...request, outputColumns: modelColumns, project, sources }), stream), modelColumns)
      : {};
    const values = fillSocialColumns(modelValues, request.outputColumns, website.socialLinks);
    const incompleteColumns = request.outputColumns.filter((column) => !values[column]?.trim());
    if (incompleteColumns.length === request.outputColumns.length) {
      throw new RequestError("No supported answers were found for this row. Check its website and sources.", 422);
    }
    step(stream, "research", "Researching this row", "completed");
    finish(stream, 200, { values, incompleteColumns, sources: sources.map(({ title, url }) => ({ title, url })) });
  } catch (error) {
    console.error("Xclay request failed:", error?.name || "UnknownError", error?.statusCode || 500);
    const statusCode = error instanceof RequestError ? error.statusCode : 500;
    finish(stream, statusCode, { error: statusCode === 500 ? "Xclay could not complete this row. Please retry." : error.message, sources: sources.map(({ title, url }) => ({ title, url })) });
  }
});
