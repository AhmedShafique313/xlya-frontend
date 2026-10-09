import crypto from "node:crypto";
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import ExcelJS from "exceljs";

const REGION = process.env.AWS_REGION || "us-east-1";
const PROJECTS_TABLE = process.env.PROJECTS_TABLE_NAME;
const VIBE_TABLE = process.env.VIBE_PROSPECTING_TABLE_NAME;
const AGENT_TABLE = process.env.VIBE_PROSPECTING_AGENT_TABLE_NAME;
const VIBE_CLIENT_ID = process.env.VIBE_PROSPECTING_CLIENT_ID;
const VIBE_TOKEN_ENDPOINT = process.env.VIBE_PROSPECTING_TOKEN_ENDPOINT;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_MODEL_ID = process.env.NVIDIA_MODEL_ID || "openai/gpt-oss-20b";
const S3_BUCKET = process.env.S3_BUCKET_NAME;
const MCP_URL = "https://vibeprospecting.explorium.ai/mcp";

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const s3Client = new S3Client({ region: REGION });

/* ---------- NDJSON step/result helpers (see .claude/lambda-logic.md) ---------- */

function emit(responseStream, event) {
  responseStream.write(JSON.stringify(event) + "\n");
}
const STEP_HEARTBEAT_MS = 2000;
const stepHeartbeats = new WeakMap();
function clearStepHeartbeat(responseStream, step) {
  const active = stepHeartbeats.get(responseStream);
  if (!active) return;
  clearInterval(active.get(step));
  active.delete(step);
}
function started(responseStream, step, label, parent) {
  emit(responseStream, { type: "step", step, parent: parent || null, status: "started", label });
  clearStepHeartbeat(responseStream, step);
  const active = stepHeartbeats.get(responseStream) || new Map();
  const timer = setInterval(() => {
    try {
      emit(responseStream, { type: "step", step, parent: parent || null, status: "started", label });
    } catch {
      clearStepHeartbeat(responseStream, step);
    }
  }, STEP_HEARTBEAT_MS);
  active.set(step, timer);
  stepHeartbeats.set(responseStream, active);
}
function completed(responseStream, step, label, parent, data) {
  clearStepHeartbeat(responseStream, step);
  emit(responseStream, { type: "step", step, parent: parent || null, status: "completed", label, ...(data ? { data } : {}) });
}
function failed(responseStream, step, label, parent, message) {
  clearStepHeartbeat(responseStream, step);
  emit(responseStream, { type: "step", step, parent: parent || null, status: "failed", label, error: message });
}
function result(responseStream, statusCode, body) {
  for (const timer of stepHeartbeats.get(responseStream)?.values() || []) clearInterval(timer);
  stepHeartbeats.delete(responseStream);
  emit(responseStream, { type: "result", statusCode, ...body });
  responseStream.end();
}
async function message(responseStream, text) {
  // These replies are assembled after the search/LLM stage, so stream the
  // finished text in small chunks while the browser renders one chat bubble.
  // Keep the complete message event for existing clients and job history.
  const characters = Array.from(text);
  for (let i = 0; i < characters.length; i += 8) {
    emit(responseStream, { type: "message_delta", role: "assistant", text: characters.slice(i, i + 8).join("") });
    if (i + 8 < characters.length) await new Promise((resolve) => setTimeout(resolve, 30));
  }
  emit(responseStream, { type: "message", role: "assistant", text });
}
function httpError(statusCode, msg) {
  const err = new Error(msg);
  err.statusCode = statusCode;
  return err;
}

function extractAccessToken(event) {
  const header = event.headers?.authorization || event.headers?.Authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

async function getSubFromToken(accessToken) {
  const userResult = await cognitoClient.send(new GetUserCommand({ AccessToken: accessToken }));
  const attrs = userResult.UserAttributes || [];
  return attrs.find((a) => a.Name === "sub")?.Value;
}

/* ---------- Project ownership + context ---------- */

async function getOwnedProject(sub, project_id) {
  const getResult = await ddbDocClient.send(new GetCommand({ TableName: PROJECTS_TABLE, Key: { sub, project_id } }));
  if (!getResult.Item) throw httpError(404, "Project not found.");
  return getResult.Item;
}

/* ---------- Vibe Prospecting token handling (refresh-on-demand) ---------- */

async function postForm(url, params) {
  const body = new URLSearchParams(params).toString();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON body
  }
  return { ok: res.ok, status: res.status, json };
}

async function getValidVibeToken(project_id) {
  const getResult = await ddbDocClient.send(new GetCommand({ TableName: VIBE_TABLE, Key: { project_id } }));
  const item = getResult.Item;
  if (!item || item.connection_status !== "connected" || !item.access_token) {
    throw httpError(409, "Vibe Prospecting isn't connected for this project yet. Connect it from Integrations first.");
  }

  const expiresAt = item.expires_at || 0;
  if (expiresAt > Date.now() + 60000) return item.access_token;

  if (!item.refresh_token) {
    throw httpError(409, "The Vibe Prospecting connection expired and can't be refreshed. Please reconnect it.");
  }

  const tokenRes = await postForm(VIBE_TOKEN_ENDPOINT, {
    grant_type: "refresh_token",
    refresh_token: item.refresh_token,
    client_id: VIBE_CLIENT_ID,
  });
  if (!tokenRes.ok || !tokenRes.json?.access_token) {
    throw httpError(409, "Couldn't refresh the Vibe Prospecting connection. Please reconnect it.");
  }

  const { access_token, refresh_token, expires_in } = tokenRes.json;
  const now = new Date().toISOString();
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: VIBE_TABLE,
      Key: { project_id },
      UpdateExpression: "SET access_token = :at, refresh_token = :rt, expires_at = :ea, updated_at = :now",
      ExpressionAttributeValues: {
        ":at": access_token,
        ":rt": refresh_token ?? item.refresh_token,
        ":ea": expires_in ? Date.now() + expires_in * 1000 : null,
        ":now": now,
      },
    })
  );
  return access_token;
}

/* ---------- MCP (Explorium) JSON-RPC over Streamable HTTP ---------- */
// Re-initializes on every Lambda invocation rather than persisting the
// transport-level Mcp-Session-Id across turns — a chat can pause for an
// arbitrary amount of time waiting on the user, and that id is a live
// connection handle, not a durable business identifier. The durable handle
// that actually threads state across turns is the caller-chosen `session_id`
// tool parameter plus the `table_name` each stage's tool call returns, both
// of which live in our own DynamoDB job row, not on Explorium's transport.

function parseMcpResponse(text) {
  const dataLines = text.split("\n").filter((l) => l.startsWith("data:"));
  if (dataLines.length === 0) throw new Error("Empty MCP response");
  const last = dataLines[dataLines.length - 1].slice(5).trim();
  return JSON.parse(last);
}

async function mcpRequest(accessToken, sessionId, body) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${accessToken}`,
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;
  const res = await fetch(MCP_URL, { method: "POST", headers, body: JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(`MCP request failed (${res.status}): ${text.slice(0, 300)}`);
  return { parsed: parseMcpResponse(text), sessionId: res.headers.get("mcp-session-id") };
}

async function mcpInitialize(accessToken) {
  const { sessionId } = await mcpRequest(accessToken, undefined, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "xlya-vibe-prospecting-agent", version: "1.0.0" } },
  });
  if (!sessionId) throw new Error("MCP server did not return an Mcp-Session-Id");
  await mcpRequest(accessToken, sessionId, { jsonrpc: "2.0", method: "notifications/initialized", params: {} }).catch(() => {});
  return sessionId;
}

let mcpCallCounter = 1;
async function mcpCallTool(accessToken, transportSessionId, toolName, args) {
  const { parsed } = await mcpRequest(accessToken, transportSessionId, {
    jsonrpc: "2.0",
    id: ++mcpCallCounter,
    method: "tools/call",
    params: { name: toolName, arguments: args },
  });
  if (parsed.error) throw new Error(`MCP tool "${toolName}" error: ${parsed.error.message || JSON.stringify(parsed.error)}`);
  if (parsed.result?.isError) {
    const textBlocks = (parsed.result.content || []).filter((c) => c.type === "text").map((c) => c.text);
    throw new Error(`MCP tool "${toolName}" rejected the request: ${textBlocks.join(" ") || "unknown error"}`);
  }
  return parsed.result;
}

// Explorium requires the tool-call session_id to match
// /^session_[a-z0-9_]+_[A-Za-z0-9]+$/ ("session_" + readable words + a
// nanoid-like suffix) — confirmed live; an arbitrary string like a raw UUID
// is rejected with a regex validation error. Deriving this from our own
// job_id keeps it stable across every stage of the same job.
function toMcpSessionId(jobId) {
  return `session_xlya_agent_${jobId.replace(/-/g, "").slice(0, 20)}`;
}

// The extraction LLM is instructed to wrap enum-style filter values as
// {values:[...]}, but small models don't always follow that exactly (a bare
// array was observed live) — this is a defensive safety net, not a
// replacement for the prompt instruction.
const VALUES_WRAPPED_FILTER_KEYS = [
  "company_size", "company_revenue", "naics_category", "linkedin_category", "company_country_code",
  "company_region_country_code", "business_id", "company_tech_stack_category", "company_tech_stack_tech",
  "website_keywords", "number_of_locations", "city_region", "prospect_country_code",
  "prospect_region_country_code", "job_title", "job_level", "job_department", "interests", "skills",
];
function normalizeFilters(filters) {
  if (!filters || typeof filters !== "object") return filters;
  const normalized = {};
  for (const [key, value] of Object.entries(filters)) {
    if (VALUES_WRAPPED_FILTER_KEYS.includes(key) && value !== null && typeof value === "object" && !Array.isArray(value) && "values" in value) {
      normalized[key] = value; // already correctly shaped
    } else if (VALUES_WRAPPED_FILTER_KEYS.includes(key) && (Array.isArray(value) || typeof value === "string")) {
      normalized[key] = { values: Array.isArray(value) ? value : [value] };
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}

// The actual data (counts, table_name, sample rows) comes back inside
// result.content[].text as a JSON string (standard MCP tool-result shape) —
// this defensively finds and parses that rather than assuming one exact
// nested path, since the precise shape wasn't documented anywhere and was
// only confirmed live for tools/list, not each individual tool call.
function extractToolResultJson(toolResult) {
  const textBlocks = (toolResult?.content || []).filter((c) => c.type === "text").map((c) => c.text);
  for (const text of textBlocks) {
    try {
      return JSON.parse(text);
    } catch {
      // not JSON, keep looking
    }
  }
  return { raw_text: textBlocks.join("\n\n") };
}

function findFirstKeyDeep(obj, key, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 6) return undefined;
  if (key in obj) return obj[key];
  for (const val of Object.values(obj)) {
    const found = findFirstKeyDeep(val, key, depth + 1);
    if (found !== undefined) return found;
  }
  return undefined;
}

/* ---------- NVIDIA LLM calls (same approach as signup/create-project lambdas) ---------- */

const NVIDIA_CHAT_COMPLETIONS_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_TIMEOUT_MS = 30000;
const NVIDIA_MAX_ATTEMPTS = 3;

function repairBracketMismatch(text) {
  const stack = [];
  const chars = text.split("");
  let inString = false;
  let escapeNext = false;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escapeNext = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") {
      const opener = stack.pop();
      const expectedCloser = opener === "{" ? "}" : "]";
      if (opener && ch !== expectedCloser) chars[i] = expectedCloser;
    }
  }
  return chars.join("");
}

function tryParseJson(rawText, isValid) {
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const candidate = start !== -1 && end !== -1 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  for (const attempt of [candidate, repairBracketMismatch(candidate)]) {
    try {
      const parsed = JSON.parse(attempt);
      if (!isValid || isValid(parsed)) return parsed;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

async function callNvidiaJson(prompt, isValid) {
  for (let attempt = 1; attempt <= NVIDIA_MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NVIDIA_TIMEOUT_MS);
    let rawText = "";
    try {
      const response = await fetch(NVIDIA_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${NVIDIA_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: NVIDIA_MODEL_ID,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          top_p: 1,
          max_tokens: 4096,
          stream: false,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`NVIDIA API error ${response.status}: ${errText.slice(0, 300)}`);
      }
      const data = await response.json();
      rawText = data.choices?.[0]?.message?.content || "";
    } catch (err) {
      console.error(`NVIDIA call failed (attempt ${attempt}/${NVIDIA_MAX_ATTEMPTS}):`, err.message);
      if (attempt === NVIDIA_MAX_ATTEMPTS) return null;
      continue;
    } finally {
      clearTimeout(timeout);
    }
    const parsed = tryParseJson(rawText, isValid);
    if (parsed) return parsed;
    console.error(`NVIDIA response was not valid JSON (attempt ${attempt}/${NVIDIA_MAX_ATTEMPTS}):`, rawText.slice(0, 1000));
  }
  return null;
}

// Every "values"-style key below MUST be an object shaped exactly
// {"values": [...]}, never a bare array or bare string, e.g.
// "company_size": {"values": ["51-200"]}. Fields marked (autocomplete-only)
// require an exact value from Explorium's own autocomplete tool, which this
// extraction step doesn't have access to — confirmed live that guessing a
// plausible-looking value (e.g. "SaaS") is rejected outright as an invalid
// enum, not fuzzy-matched. Omit those unless the user's own wording exactly
// matches a real category name, rather than inventing one.
const FILTER_SCHEMA_HINT = `Available filter keys for the "filters" object (only include keys actually implied by the user's request):
- company_size {"values": ["1-10"|"11-50"|"51-200"|"201-500"|"501-1000"|"1001-5000"|"5001-10000"|"10001+"]}
- company_revenue {"values": ["<1M"|"1M-5M"|"5M-10M"|"10M-25M"|"25M-75M"|"75M-200M"|"200M-500M"|"500M-1B"|"1B+"]}
- company_country_code {"values": [<ISO Alpha-2, e.g. "US","IL">]}
- company_region_country_code {"values": [<ISO 3166-2, e.g. "US-CA">]}
- company_tech_stack_category {"values": [exactly one or more of: "Healthcare And Life Science","Technology","Marketing","E-commerce","Devops And Development","Programming Languages And Frameworks","Testing And Qa","Platform And Storage","Health Tech","Business Intelligence And Analytics","Operations Management","Customer Management","Hr","Industrial Engineering And Manufacturing","Product And Design","Sales","It Security","It Management","Other","Operations Software","Finance And Accounting","Computer Networks","Collaboration","Communications","Business","Productivity And Operations"]}
- has_website (boolean), is_public_company (boolean)
- company_age {"min": <years>, "max": <years>}
- number_of_locations {"min": <n>, "max": <n>}
- business_intent_topics {"topics": ["<free text intent topic>"], "negate": boolean}
- has_contact_details {"value": "email"|"phone"|"email_or_phone"|"email_and_phone"}
- job_level {"values": [one or more of: "c_suite","vp","director","manager","senior","entry","junior"]}
- total_experience_months {"min": <months>, "max": <months>}
- prospect_country_code {"values": [<ISO Alpha-2>]}, prospect_region_country_code {"values": [<ISO 3166-2>]}

Do NOT use naics_category, linkedin_category, company_tech_stack_tech, website_keywords, city_region, job_title, job_department, interests, or skills (autocomplete-only, exact values not available here) — omit the underlying idea entirely rather than guessing a value for these, even if the user's wording suggests one.`;

async function extractFiltersAndSignal(userMessage, projectContext) {
  const prompt = `You are extracting structured search parameters for a B2B prospecting tool from a user's natural-language request.

Project context (for reference only, don't invent filters not implied by the actual request): ${JSON.stringify(projectContext).slice(0, 1500)}

User's request: "${userMessage}"

${FILTER_SCHEMA_HINT}

Also decide if the request includes a condition that should be checked AFTER search/enrichment (a "signal filter") — e.g. "only companies that posted about hiring" or "only if they mention AI on LinkedIn". If the condition can be checked by an exact keyword/field match, mark it "exact". If it requires judgment/semantic understanding, mark it "fuzzy". If there's no such extra condition, set signal_filter to null.

Respond with ONLY a single strictly valid JSON object, no markdown fences, no prose:
{
  "entity_type": "businesses" | "prospects",
  "filters": { ... only relevant keys from the list above ... },
  "signal_filter": null | { "type": "exact", "field": "<string>", "value": "<string>" } | { "type": "fuzzy", "description": "<string>" }
}`;
  const parsed = await callNvidiaJson(prompt, (p) => p && (p.entity_type === "businesses" || p.entity_type === "prospects") && p.filters);
  if (!parsed) throw httpError(502, "Couldn't understand that request well enough to search. Could you rephrase it?");
  return parsed;
}

async function classifyReply(stageLabel, proposedSummary, userMessage) {
  const prompt = `A prospecting agent just completed this stage: "${stageLabel}".
It found/proposed: ${JSON.stringify(proposedSummary).slice(0, 1000)}

The user replied: "${userMessage}"

Classify the reply. Respond with ONLY a strictly valid JSON object, no markdown fences:
{ "decision": "confirm" | "refine" | "cancel", "refinement_instructions": "<string, only if decision is refine>" }`;
  const parsed = await callNvidiaJson(prompt, (p) => p && ["confirm", "refine", "cancel"].includes(p.decision));
  return parsed || { decision: "confirm" };
}

async function classifyFuzzyMatches(rows, description) {
  const prompt = `Decide which of these records match this condition: "${description}".

Records (indexed): ${JSON.stringify(rows.slice(0, 50)).slice(0, 8000)}

Respond with ONLY a strictly valid JSON object, no markdown fences:
{ "matching_indexes": [0, 2, 5, ...] }`;
  const parsed = await callNvidiaJson(prompt, (p) => p && Array.isArray(p.matching_indexes));
  return parsed?.matching_indexes ?? rows.map((_, i) => i);
}

/* ---------- Prompt template library (personalized against the project's own ICP/competitors/description) ---------- */

const TEMPLATES = [
  { id: "similar_to_competitors", label: "Find companies like my competitors", build: (p) => `Find companies similar to: ${(p.competitors || []).map((c) => c.name).join(", ") || "my known competitors"}.` },
  { id: "icp_target_companies", label: "Find companies matching my ideal customer profile", build: (p) => `Find companies matching this target audience: ${p.icp?.target_audience || p.description || "our ideal customers"}.` },
  { id: "decision_makers_at_icp", label: "Find decision-makers at my target companies", build: (p) => `Find decision-makers (director level and above) at companies matching: ${p.icp?.target_audience || p.description || "our ideal customers"}.` },
  { id: "buying_intent_icp", label: "Find ICP-matching companies showing buying intent", build: (p) => `Find companies matching our ideal customer profile (${p.icp?.target_audience || p.description || "our target market"}) that are currently showing buying intent relevant to our offering.` },
  { id: "contacts_with_email", label: "Find contactable prospects at target companies", build: (p) => `Find prospects with verified email contact details at companies matching: ${p.icp?.target_audience || p.description || "our ideal customers"}.` },
];

function personalizedTemplates(projectRow) {
  return TEMPLATES.map((t) => ({ id: t.id, label: t.label, prompt: t.build(projectRow) }));
}

/* ---------- Job (DynamoDB) helpers ---------- */

async function getJob(project_id, job_id) {
  const r = await ddbDocClient.send(new GetCommand({ TableName: AGENT_TABLE, Key: { project_id, job_id } }));
  return r.Item || null;
}

async function createJob(project_id, template_id) {
  const job_id = crypto.randomUUID();
  const now = new Date().toISOString();
  const item = {
    project_id,
    job_id,
    stage: 0,
    template_id: template_id || null,
    messages: [],
    context: {},
    status: "active",
    created_at: now,
    updated_at: now,
  };
  await ddbDocClient.send(new PutCommand({ TableName: AGENT_TABLE, Item: item }));
  return item;
}

async function saveJob(job) {
  job.updated_at = new Date().toISOString();
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: AGENT_TABLE,
      Key: { project_id: job.project_id, job_id: job.job_id },
      UpdateExpression: "SET stage = :stage, messages = :messages, context = :context, #status = :status, updated_at = :now, s3_key = :s3_key, download_ready_at = :dra",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":stage": job.stage,
        ":messages": job.messages,
        ":context": job.context,
        ":status": job.status,
        ":now": job.updated_at,
        ":s3_key": job.s3_key ?? null,
        ":dra": job.download_ready_at ?? null,
      },
    })
  );
}

function appendMessage(job, role, text) {
  job.messages.push({ role, text, created_at: new Date().toISOString() });
}

/* ---------- Stage implementations ---------- */

async function stageSearch(responseStream, parent, accessToken, mcpSession, job, userMessageForReasoning) {
  started(responseStream, "stage_search", "Searching Vibe Prospecting", parent);
  const { entity_type, filters } = job.context;
  const toolName = "fetch-entities";
  const toolResult = await mcpCallTool(accessToken, mcpSession, toolName, {
    entity_type,
    filters,
    session_id: toMcpSessionId(job.job_id),
    tool_reasoning: userMessageForReasoning,
  });
  const parsedJson = extractToolResultJson(toolResult);
  const table_name = findFirstKeyDeep(parsedJson, "table_name");
  const records_matching_filters = findFirstKeyDeep(parsedJson, "records_matching_filters");
  const records_available = findFirstKeyDeep(parsedJson, "records_available");
  if (!table_name) throw new Error("Search didn't return a usable result table.");
  job.context.table_name = table_name;
  job.context.search_summary = { records_matching_filters, records_available };
  completed(responseStream, "stage_search", "Searching Vibe Prospecting", parent, job.context.search_summary);
  return job.context.search_summary;
}

async function stageEnrich(responseStream, parent, accessToken, mcpSession, job) {
  started(responseStream, "stage_enrich", "Enriching results", parent);
  const toolName = job.context.entity_type === "prospects" ? "enrich-prospects" : "enrich-business";
  // Confirmed live via a deliberately-invalid probe call — these enum
  // values are prefixed with the tool name, not the bare concept name.
  const enrichments =
    job.context.entity_type === "prospects"
      ? ["enrich-prospects-contacts", "enrich-prospects-profiles"]
      : ["enrich-business-firmographics"];
  const toolResult = await mcpCallTool(accessToken, mcpSession, toolName, {
    table_name: job.context.table_name,
    enrichments,
    session_id: toMcpSessionId(job.job_id),
  });
  const parsedJson = extractToolResultJson(toolResult);
  const records_available = findFirstKeyDeep(parsedJson, "records_available");
  job.context.enrich_summary = { records_available };
  completed(responseStream, "stage_enrich", "Enriching results", parent, job.context.enrich_summary);
  return job.context.enrich_summary;
}

async function stageSignalCheck(responseStream, parent, job) {
  started(responseStream, "stage_signal_check", "Checking conditions", parent);
  const signalFilter = job.context.signal_filter;
  if (!signalFilter) {
    job.context.filter_summary = { applied: false };
    completed(responseStream, "stage_signal_check", "Checking conditions", parent, job.context.filter_summary);
    return job.context.filter_summary;
  }
  // The exact-match branch is plain code, no LLM — only the fuzzy branch
  // spends an NVIDIA call, per the "no LLM unless truly fuzzy" instruction.
  // Row-level data for either branch would come from a sample/preview tool
  // call against context.table_name; this is intentionally left as a
  // narrow follow-up once the first live run confirms the enrichment
  // preview's row shape, so the exact/fuzzy branching logic isn't guessed
  // against an unconfirmed schema.
  job.context.filter_summary = { applied: true, type: signalFilter.type, note: "Signal check recorded; row-level filtering applied at export time." };
  completed(responseStream, "stage_signal_check", "Checking conditions", parent, job.context.filter_summary);
  return job.context.filter_summary;
}

function rowsToCsv(rows) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(","));
  return lines.join("\n");
}

async function rowsToXlsxBuffer(rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Results");
  if (rows.length > 0) {
    sheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key }));
    sheet.addRows(rows);
  }
  return workbook.xlsx.writeBuffer();
}

// export-to-csv doesn't return row data inline — confirmed live it returns
// metadata about an export it performed on Explorium's own side, including
// `_full_download_url` (a share.explorium.ai link that 302-redirects to a
// presigned S3 URL serving the real, unmasked CSV). We fetch that
// server-side and parse it ourselves rather than ever handing that link
// (Explorium's own) to the user.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}

async function stageExport(responseStream, parent, accessToken, mcpSession, job, sub, format) {
  started(responseStream, "stage_export", "Exporting results", parent);
  const toolResult = await mcpCallTool(accessToken, mcpSession, "export-to-csv", {
    table_name: job.context.table_name,
    session_id: toMcpSessionId(job.job_id),
    dataset_name: `xlya_job_${job.job_id.replace(/-/g, "_")}`.slice(0, 80),
    tool_reasoning: "Exporting the final filtered result set for the user to download.",
  });
  const parsedJson = extractToolResultJson(toolResult);
  const fullDownloadUrl = findFirstKeyDeep(parsedJson, "_full_download_url") || findFirstKeyDeep(parsedJson, "_core_download_url");
  if (!fullDownloadUrl) throw new Error("Export didn't return a downloadable dataset.");

  const csvRes = await fetch(fullDownloadUrl);
  if (!csvRes.ok) throw new Error(`Couldn't fetch the exported dataset (${csvRes.status}).`);
  const csvText = await csvRes.text();
  let rows = parseCsv(csvText);

  if (job.context.signal_filter?.type === "fuzzy" && rows.length > 0) {
    const keepIndexes = await classifyFuzzyMatches(rows, job.context.signal_filter.description);
    rows = rows.filter((_, i) => keepIndexes.includes(i));
  } else if (job.context.signal_filter?.type === "exact" && rows.length > 0) {
    const { field, value } = job.context.signal_filter;
    rows = rows.filter((r) => String(r[field] ?? "").toLowerCase().includes(String(value).toLowerCase()));
  }

  const ext = format === "xlsx" ? "xlsx" : "csv";
  const fileName = `xlya_prospects_${job.job_id}.${ext}`;
  const body = ext === "xlsx" ? await rowsToXlsxBuffer(rows) : rowsToCsv(rows);
  const contentType = ext === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/csv";
  const key = `vibeprospecting/${sub}/${job.project_id}/${fileName}`;

  await s3Client.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: body, ContentType: contentType }));
  const downloadUrl = await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }), { expiresIn: 3600 });

  job.s3_key = key;
  job.download_ready_at = new Date().toISOString();
  job.stage = 5;
  job.status = "completed";
  completed(responseStream, "stage_export", "Exporting results", parent, { row_count: rows.length, key });
  return { downloadUrl, rowCount: rows.length };
}

/* ---------- Action: welcome ---------- */

async function handleWelcome(responseStream, sub, project_id) {
  started(responseStream, "load_project", "Loading project context");
  const project = await getOwnedProject(sub, project_id);
  completed(responseStream, "load_project", "Loading project context");

  result(responseStream, 200, {
    project_context: {
      project_name: project.project_name,
      description: project.description ?? null,
      icp: project.icp ?? null,
      competitors: project.competitors ?? null,
    },
    templates: personalizedTemplates(project),
  });
}

/* ---------- Action: get_job / list_jobs ---------- */

async function handleGetJob(responseStream, sub, project_id, job_id) {
  await getOwnedProject(sub, project_id);
  started(responseStream, "load_job", "Loading conversation");
  const job = await getJob(project_id, job_id);
  if (!job) {
    failed(responseStream, "load_job", "Loading conversation", null, "Job not found");
    result(responseStream, 404, { error: "Conversation not found." });
    return;
  }
  completed(responseStream, "load_job", "Loading conversation");
  result(responseStream, 200, { job_id, stage: job.stage, messages: job.messages, status: job.status, s3_key: job.s3_key ?? null });
}

async function handleListJobs(responseStream, sub, project_id) {
  await getOwnedProject(sub, project_id);
  started(responseStream, "list_jobs", "Loading past jobs");
  const q = await ddbDocClient.send(new QueryCommand({ TableName: AGENT_TABLE, KeyConditionExpression: "project_id = :p", ExpressionAttributeValues: { ":p": project_id } }));
  const jobs = (q.Items || []).map((j) => ({ job_id: j.job_id, stage: j.stage, template_id: j.template_id, status: j.status, created_at: j.created_at, s3_key: j.s3_key ?? null }));
  completed(responseStream, "list_jobs", "Loading past jobs", null, { count: jobs.length });
  result(responseStream, 200, { jobs });
}

/* ---------- Action: chat (custom flow, pauses each stage) ---------- */

async function handleChat(responseStream, sub, project_id, job_id, userMessage) {
  started(responseStream, "load_context", "Loading project and conversation");
  const project = await getOwnedProject(sub, project_id);
  let job = job_id ? await getJob(project_id, job_id) : null;
  if (!job) job = await createJob(project_id, null);
  completed(responseStream, "load_context", "Loading project and conversation");

  appendMessage(job, "user", userMessage);

  started(responseStream, "connect_vibe", "Connecting to Vibe Prospecting");
  const vibeToken = await getValidVibeToken(project_id);
  const mcpSession = await mcpInitialize(vibeToken);
  completed(responseStream, "connect_vibe", "Connecting to Vibe Prospecting");

  try {
    if (job.stage === 0) {
      started(responseStream, "stage_extract", "Understanding your request");
      const extracted = await extractFiltersAndSignal(userMessage, {
        project_name: project.project_name,
        icp: project.icp,
        competitors: project.competitors,
      });
      job.context.entity_type = extracted.entity_type;
      job.context.filters = normalizeFilters(extracted.filters);
      job.context.signal_filter = extracted.signal_filter;
      job.stage = 1;
      completed(responseStream, "stage_extract", "Understanding your request", null, extracted);
      const reply = `Got it — I'll search for ${extracted.entity_type} matching: ${JSON.stringify(extracted.filters)}${extracted.signal_filter ? `, then check: ${extracted.signal_filter.description || extracted.signal_filter.value}` : ""}. Want me to run the search now?`;
      appendMessage(job, "assistant", reply);
      await message(responseStream, reply);
      await saveJob(job);
      result(responseStream, 200, { job_id: job.job_id, stage: job.stage, reply, awaiting_confirmation: true });
      return;
    }

    started(responseStream, "classify_reply", "Interpreting your response");
    const decision = await classifyReply(
      `stage ${job.stage}`,
      job.stage === 1 ? job.context.filters : job.stage === 2 ? job.context.search_summary : job.stage === 3 ? job.context.enrich_summary : job.context.filter_summary,
      userMessage
    );
    completed(responseStream, "classify_reply", "Interpreting your response");

    if (decision.decision === "cancel") {
      job.status = "cancelled";
      const reply = "No problem, cancelled this request. Start a new one whenever you're ready.";
      appendMessage(job, "assistant", reply);
      await saveJob(job);
      await message(responseStream, reply);
      result(responseStream, 200, { job_id: job.job_id, stage: job.stage, reply, awaiting_confirmation: false });
      return;
    }

    if (decision.decision === "refine") {
      started(responseStream, "stage_refine", "Adjusting your request");
      const extracted = await extractFiltersAndSignal(decision.refinement_instructions || userMessage, {
        project_name: project.project_name,
        icp: project.icp,
        competitors: project.competitors,
        previous_filters: job.context.filters,
      });
      job.context.entity_type = extracted.entity_type;
      job.context.filters = normalizeFilters(extracted.filters);
      job.context.signal_filter = extracted.signal_filter;
      completed(responseStream, "stage_refine", "Adjusting your request", null, extracted);
      const reply = `Updated — I'll search for ${extracted.entity_type} matching: ${JSON.stringify(extracted.filters)}. Ready to run it?`;
      appendMessage(job, "assistant", reply);
      await message(responseStream, reply);
      await saveJob(job);
      result(responseStream, 200, { job_id: job.job_id, stage: job.stage, reply, awaiting_confirmation: true });
      return;
    }

    // decision === "confirm" — advance exactly one stage
    if (job.stage === 1) {
      const summary = await stageSearch(responseStream, null, vibeToken, mcpSession, job, userMessage);
      job.stage = 2;
      const reply = `Found ${summary.records_available ?? "some"} of ${summary.records_matching_filters ?? "?"} matching records. Want me to enrich these with more details?`;
      appendMessage(job, "assistant", reply);
      await message(responseStream, reply);
      await saveJob(job);
      result(responseStream, 200, { job_id: job.job_id, stage: job.stage, reply, awaiting_confirmation: true });
      return;
    }

    if (job.stage === 2) {
      const summary = await stageEnrich(responseStream, null, vibeToken, mcpSession, job);
      job.stage = 3;
      const reply = `Enriched ${summary.records_available ?? "the"} records. ${job.context.signal_filter ? "Should I check the extra condition you mentioned next?" : "Ready to export the results?"}`;
      appendMessage(job, "assistant", reply);
      await message(responseStream, reply);
      await saveJob(job);
      result(responseStream, 200, { job_id: job.job_id, stage: job.stage, reply, awaiting_confirmation: true });
      return;
    }

    if (job.stage === 3) {
      await stageSignalCheck(responseStream, null, job);
      job.stage = 4;
      const reply = "Done. Ready to export the final results?";
      appendMessage(job, "assistant", reply);
      await message(responseStream, reply);
      await saveJob(job);
      result(responseStream, 200, { job_id: job.job_id, stage: job.stage, reply, awaiting_confirmation: true });
      return;
    }

    if (job.stage === 4) {
      const { downloadUrl, rowCount } = await stageExport(responseStream, null, vibeToken, mcpSession, job, sub, "csv");
      await saveJob(job);
      // Stage 5 never appears in `messages` — the download is a distinct
      // result field, not a chat bubble.
      result(responseStream, 200, { job_id: job.job_id, stage: job.stage, download_url: downloadUrl, row_count: rowCount, awaiting_confirmation: false });
      return;
    }

    // stage 5 (already completed) and a new message arrives — treat as a new job
    const freshJob = await createJob(project_id, null);
    appendMessage(freshJob, "user", userMessage);
    await saveJob(freshJob);
    const reply = "That job's already finished — starting a new one. What are you looking for?";
    await message(responseStream, reply);
    result(responseStream, 200, { job_id: freshJob.job_id, stage: 0, reply, awaiting_confirmation: false });
  } catch (err) {
    await saveJob(job).catch(() => {});
    throw err;
  }
}

/* ---------- Action: run_template (all 5 stages in one invocation, no pausing) ---------- */

async function handleRunTemplate(responseStream, sub, project_id, template_id, extraMessage) {
  started(responseStream, "load_context", "Loading project and template");
  const project = await getOwnedProject(sub, project_id);
  const template = TEMPLATES.find((t) => t.id === template_id);
  if (!template) throw httpError(400, `Unknown template_id: ${template_id}`);

  const job = await createJob(project_id, template_id);
  const promptText = extraMessage ? `${template.build(project)} ${extraMessage}` : template.build(project);
  appendMessage(job, "user", promptText);
  completed(responseStream, "load_context", "Loading project and template");

  started(responseStream, "connect_vibe", "Connecting to Vibe Prospecting");
  const vibeToken = await getValidVibeToken(project_id);
  const mcpSession = await mcpInitialize(vibeToken);
  completed(responseStream, "connect_vibe", "Connecting to Vibe Prospecting");

  started(responseStream, "stage_extract", "Understanding the request");
  const extracted = await extractFiltersAndSignal(promptText, { project_name: project.project_name, icp: project.icp, competitors: project.competitors });
  job.context.entity_type = extracted.entity_type;
  job.context.filters = normalizeFilters(extracted.filters);
  job.context.signal_filter = extracted.signal_filter;
  job.stage = 1;
  completed(responseStream, "stage_extract", "Understanding the request", null, extracted);
  appendMessage(job, "assistant", `Searching for ${extracted.entity_type} matching your request…`);
  await message(responseStream, `Searching for ${extracted.entity_type} matching your request…`);

  const searchSummary = await stageSearch(responseStream, null, vibeToken, mcpSession, job, promptText);
  job.stage = 2;
  appendMessage(job, "assistant", `Found ${searchSummary.records_available ?? "some"} matching records. Enriching now…`);
  await message(responseStream, `Found ${searchSummary.records_available ?? "some"} matching records. Enriching now…`);

  const enrichSummary = await stageEnrich(responseStream, null, vibeToken, mcpSession, job);
  job.stage = 3;
  appendMessage(job, "assistant", `Enriched ${enrichSummary.records_available ?? "the"} records. Checking conditions…`);
  await message(responseStream, `Enriched ${enrichSummary.records_available ?? "the"} records. Checking conditions…`);

  await stageSignalCheck(responseStream, null, job);
  job.stage = 4;

  const { downloadUrl, rowCount } = await stageExport(responseStream, null, vibeToken, mcpSession, job, sub, "csv");
  await saveJob(job);

  result(responseStream, 200, { job_id: job.job_id, stage: job.stage, download_url: downloadUrl, row_count: rowCount, awaiting_confirmation: false });
}

/* ---------- Handler ---------- */

const VALID_ACTIONS = ["welcome", "get_job", "list_jobs", "chat", "run_template"];

export const handler = awslambda.streamifyResponse(async (event, responseStream) => {
  responseStream = awslambda.HttpResponseStream.from(responseStream, {
    statusCode: 200,
    headers: {
      "Content-Type": "application/x-ndjson",
      "Access-Control-Allow-Origin": "*", // tighten to https://app.xlya.app in production
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
    },
  });

  if (event.requestContext?.http?.method === "OPTIONS") {
    // Function URL (not API Gateway) — OPTIONS really does reach this
    // handler, and response streaming only flushes the header prelude once
    // at least one chunk is written. See .claude/lambda-logic.md.
    responseStream.write("\n");
    responseStream.end();
    return;
  }

  const accessToken = extractAccessToken(event);

  let payload;
  try {
    payload = typeof event.body === "string" ? JSON.parse(event.body || "{}") : event.body || {};
  } catch {
    emit(responseStream, { type: "error", error: "Invalid JSON body" });
    responseStream.end();
    return;
  }

  const { action, project_id, job_id, message: userMessage, template_id } = payload || {};

  started(responseStream, "validation", "Validating request");
  const errors = [];
  if (!accessToken) errors.push("a valid Authorization bearer token is required");
  if (!action || !VALID_ACTIONS.includes(action)) errors.push(`action must be one of: ${VALID_ACTIONS.join(", ")}`);
  if (!project_id) errors.push("project_id is required");
  if (action === "get_job" && !job_id) errors.push("job_id is required for get_job");
  if (action === "chat" && !userMessage) errors.push("message is required for chat");
  if (action === "run_template" && !template_id) errors.push("template_id is required for run_template");
  if (errors.length > 0) {
    failed(responseStream, "validation", "Validating request", null, errors.join("; "));
    result(responseStream, !accessToken ? 401 : 400, {
      error: !accessToken ? "Missing or invalid authorization token." : "Validation failed",
      details: errors,
    });
    return;
  }
  completed(responseStream, "validation", "Validating request");

  try {
    started(responseStream, "get_user", "Verifying your session");
    const sub = await getSubFromToken(accessToken);
    completed(responseStream, "get_user", "Verifying your session", null, { sub });

    if (action === "welcome") return await handleWelcome(responseStream, sub, project_id);
    if (action === "get_job") return await handleGetJob(responseStream, sub, project_id, job_id);
    if (action === "list_jobs") return await handleListJobs(responseStream, sub, project_id);
    if (action === "chat") return await handleChat(responseStream, sub, project_id, job_id, userMessage);
    if (action === "run_template") return await handleRunTemplate(responseStream, sub, project_id, template_id, userMessage);
  } catch (err) {
    console.error("Vibe Prospecting agent error:", err);
    let statusCode = err.statusCode || 500;
    let errorMessage = err.statusCode ? err.message : "Something went wrong. Please try again.";
    if (!err.statusCode) {
      switch (err.name) {
        case "NotAuthorizedException":
          statusCode = 401;
          errorMessage = "Your session has expired. Please log in again.";
          break;
        case "UserNotFoundException":
          statusCode = 404;
          errorMessage = "Account not found.";
          break;
      }
    }
    result(responseStream, statusCode, { error: errorMessage });
  }
});
