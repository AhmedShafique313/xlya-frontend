import { calculateFunnel, InputError } from "./funnel.mjs";
import { analyzeCsv } from "./csv.mjs";

const MAX_REQUEST_BYTES = 5 * 1024 * 1024;
const COGNITO_REGION = process.env.AWS_REGION || "us-east-1";

function eventHeader(event, name) {
  const headers = event.headers ?? {};
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
  return key ? headers[key] : "";
}

function parseRequest(event) {
  if (typeof event.body !== "string") throw new InputError("Invalid request", ["A JSON request body is required."]);
  const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64") : Buffer.from(event.body, "utf8");
  if (raw.byteLength > MAX_REQUEST_BYTES) throw new InputError("Invalid request", [`Request body must be no larger than ${MAX_REQUEST_BYTES} bytes.`]);
  let body;
  try {
    body = JSON.parse(raw.toString("utf8"));
  } catch {
    throw new InputError("Invalid request", ["Request body must contain valid JSON."]);
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) throw new InputError("Invalid request", ["Request body must be a JSON object."]);
  if (!["calculate", "analyze_csv", "calculate_from_csv"].includes(body.action) || body.schemaVersion !== 1) {
    throw new InputError("Invalid request", ["action must be calculate, analyze_csv, or calculate_from_csv, with schemaVersion 1."]);
  }
  return body;
}

function extractBearer(event) {
  const value = eventHeader(event, "authorization");
  const match = typeof value === "string" ? value.match(/^Bearer\s+(.+)$/i) : null;
  return match?.[1]?.trim() || null;
}

async function resolveCognitoSub(accessToken) {
  const response = await fetch(`https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`, {
    method: "POST",
    headers: {
      "content-type": "application/x-amz-json-1.1",
      "x-amz-target": "AWSCognitoIdentityProviderService.GetUser",
    },
    body: JSON.stringify({ AccessToken: accessToken }),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    const err = new Error("Cognito rejected the access token.");
    err.name = response.status === 400 || response.status === 401 ? "NotAuthorizedException" : "CognitoUnavailable";
    throw err;
  }
  const result = await response.json();
  const sub = result.UserAttributes?.find((attribute) => attribute.Name === "sub")?.Value;
  if (typeof sub !== "string" || !sub) {
    const err = new Error("Cognito user identity was not returned.");
    err.name = "NotAuthorizedException";
    throw err;
  }
  return sub;
}

function emit(responseStream, event) {
  responseStream.write(`${JSON.stringify(event)}\n`);
}

function send(responseStream, events, statusCode, fields) {
  for (const event of events) emit(responseStream, event);
  emit(responseStream, { type: "result", statusCode, ...fields });
  responseStream.end();
}

function step(stepName, label, status, error) {
  return { type: "step", step: stepName, parent: null, label, status, ...(error ? { error } : {}) };
}

export const handler = awslambda.streamifyResponse(async (event, responseStream) => {
  const stream = awslambda.HttpResponseStream.from(responseStream, {
    statusCode: 200,
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
  const method = event.requestContext?.http?.method ?? event.httpMethod ?? "POST";
  if (method === "OPTIONS") {
    stream.end();
    return;
  }
  if (method !== "POST") {
    send(stream, [], 405, { error: "Method not allowed.", details: ["Use POST for calculator requests."] });
    return;
  }

  const events = [];
  try {
    events.push(step("authentication", "Verifying your session", "started"));
    const accessToken = extractBearer(event);
    if (!accessToken) {
      events.push(step("authentication", "Verifying your session", "failed", "A bearer access token is required."));
      send(stream, events, 401, { error: "Your session is missing or expired." });
      return;
    }
    await resolveCognitoSub(accessToken);
    events.push(step("authentication", "Verifying your session", "completed"));

    events.push(step("validation", "Checking the calculator request", "started"));
    const request = parseRequest(event);
    let csvAnalysis = null;
    if (request.action === "analyze_csv" || request.action === "calculate_from_csv") {
      events.push(step("csv_analysis", "Reading and deduplicating imported leads", "started"));
      csvAnalysis = analyzeCsv(request.csv);
      events.push(step("csv_analysis", "Reading and deduplicating imported leads", "completed"));
    }
    // The authenticated Cognito sub is intentionally not accepted from or returned to the caller.
    events.push(step("validation", "Checking the calculator request", "completed"));

    if (request.action === "analyze_csv") {
      send(stream, events, 200, { message: "CSV analyzed without saving the file.", csvAnalysis });
      return;
    }

    events.push(step("calculation", "Calculating funnel outcomes", "started"));
    const scenario = request.action === "calculate_from_csv"
      ? { ...request.scenario, mode: "forward", startingLeads: csvAnalysis.uniqueLeads }
      : request.scenario;
    const result = calculateFunnel(scenario);
    events.push(step("calculation", "Calculating funnel outcomes", "completed"));
    send(stream, events, 200, { message: "Funnel scenario calculated.", result, ...(csvAnalysis ? { csvAnalysis } : {}) });
  } catch (error) {
    console.error("Lead calculator request failed:", error?.name ?? "UnknownError");
    if (error?.name === "NotAuthorizedException") {
      events.push(step("authentication", "Verifying your session", "failed", "The access token is invalid or expired."));
      send(stream, events, 401, { error: "Your session has expired. Please log in again." });
      return;
    }
    if (error instanceof InputError) {
      if (error.phase === "calculation") {
        events.push(step("calculation", "Calculating funnel outcomes", "failed", error.message));
        send(stream, events, 422, { error: error.message, details: error.details });
        return;
      }
      const validationAlreadyStarted = events.some((item) => item.step === "validation");
      if (!validationAlreadyStarted) events.push(step("validation", "Checking the calculator request", "started"));
      events.push(step("validation", "Checking the calculator request", "failed", error.message));
      send(stream, events, 400, { error: error.message, details: error.details });
      return;
    }
    send(stream, events, 500, { error: "Something went wrong while calculating this scenario. Please try again." });
  }
});
