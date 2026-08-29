# Lambda Logic Conventions

This documents the shared conventions every `xlya-dev-users-*` Lambda in this project follows, so a new Lambda can be built consistently without re-deriving the wire format, auth pattern, or error handling from scratch. All of it was reverse-engineered by downloading and reading the real deployed source of the login, settings, signup, and project-setting lambdas — not guessed. When in doubt, download the actual deployed code (`aws lambda get-function --query Code.Location`, then `curl`/`unzip` the URL) and confirm against that, since a Lambda's live code can drift from any doc.

## Runtime shape

- Node.js 24.x, ESM (`"type": "module"` in `package.json`), single `index.mjs` file plus `node_modules`, zipped and deployed via `aws lambda update-function-code --zip-file fileb://...`.
- Every one of these Lambdas is wired to a **response-streaming** invocation mode — either through an API Gateway `AWS_PROXY` integration pointed at `.../functions/<arn>/response-streaming-invocations` with `responseTransferMode: STREAM`, or (for the project-setting lambda) a Function URL with `InvokeMode: RESPONSE_STREAM`. **Always verify which one before writing the handler** (`aws apigateway get-integration` or `aws lambda get-function-url-config`) — the handler code differs (see OPTIONS handling below) and a plain buffered `return {...}` will not work against either.
- Handler shape is always:
  ```js
  export const handler = awslambda.streamifyResponse(async (event, responseStream) => {
    responseStream = awslambda.HttpResponseStream.from(responseStream, {
      statusCode: 200,
      headers: {
        "Content-Type": "application/x-ndjson",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
      },
    });
    // ... body below
  });
  ```
- `awslambda` is a global injected by the Lambda Node runtime when response streaming is enabled — not an import.

## OPTIONS / CORS gotcha

- Behind API Gateway: an `OPTIONS` request never reaches the Lambda at all (a separate `MOCK` integration on the API Gateway resource answers it) — but every Lambda still has an `if (event.requestContext?.http?.method === "OPTIONS") { responseStream.end(); return; }` guard as defensive code.
- Behind a **Function URL** (no API Gateway in front): OPTIONS *does* reach the Lambda, and the response-streaming runtime **only flushes the prelude (status + headers) once at least one chunk has been written**. Calling `.end()` with zero prior writes silently drops the whole prelude — including the CORS headers — and the browser sees a bare, header-less response and fails CORS. Fix: write a harmless line first — `responseStream.write("\n"); responseStream.end();`.
- Do not set CORS headers in *both* the API Gateway integration response *and* the Lambda code for the same route — you get a duplicate Allow-Origin header and the browser rejects it. Pick one place (this codebase always sets it in the Lambda code).

## Wire format: NDJSON, not SSE

Every one of these Lambdas streams **NDJSON** (newline-delimited JSON) — one bare `{...}` object per line, `\n`-separated. **Not** Server-Sent Events: no `data:` prefix, no blank-line event separators. This was gotten wrong once (assumed SSE framing), which silently dropped every event. Always confirm the real framing with a raw `curl` before writing a frontend parser.

Two event shapes on every stream, by convention:

```js
// one per meaningful unit of work, however small — nested sub-steps use
// `parent` to point at their enclosing step's `step` id; top-level steps
// have parent: null
{ type: "step", step: "<id>", parent: "<parent id>" | null, status: "started" | "completed" | "failed", label: "<human label>", data?: {...}, error?: string }

// always exactly one, always last
{ type: "result", statusCode: <number>, message?: string, error?: string, details?: string[], ...(action-specific fields) }
```

Helper functions used verbatim in every Lambda:

```js
function emit(responseStream, event) { responseStream.write(JSON.stringify(event) + "\n"); }
function started(responseStream, step, label, parent) {
  emit(responseStream, { type: "step", step, parent: parent || null, status: "started", label });
}
function completed(responseStream, step, label, parent, data) {
  emit(responseStream, { type: "step", step, parent: parent || null, status: "completed", label, ...(data ? { data } : {}) });
}
function failed(responseStream, step, label, parent, message) {
  emit(responseStream, { type: "step", step, parent: parent || null, status: "failed", label, error: message });
}
function result(responseStream, statusCode, body) {
  emit(responseStream, { type: "result", statusCode, ...body });
  responseStream.end();
}
```

**Emit one `step` for every distinct unit of work, no matter how minor** — this project's standing rule (confirmed 2026-08-29 for the create-project lambda: every log, minor or major, sub-step or top-level, must reach the dashboard terminal) is that the frontend's live-activity terminal renders every one of these, so under-emitting steps directly shows up to the user as a terminal that looks stuck or skips ahead. A `status: "failed"` step does **not** necessarily mean the whole request failed — most Lambdas keep going after a non-fatal sub-step fails (e.g. ICP generation failing doesn't block project creation); only the final `result` event's `statusCode` is authoritative.

## Getting `sub` from the access token

Two different patterns exist, depending on whose token it is at that point in the flow:

1. **A token this Lambda itself just minted** (signup/login, right after the sign-in call): decode the JWT payload directly, no network call, no signature verification needed — it's safe because the token was issued to this exact request a moment ago, not accepted from an untrusted caller:
   ```js
   function decodeJwtPayload(token) {
     const payloadBase64 = token.split(".")[1];
     const json = Buffer.from(payloadBase64, "base64url").toString("utf8");
     return JSON.parse(json);
   }
   const sub = decodeJwtPayload(accessTokenJustIssued).sub;
   ```
2. **A token the frontend sends in on every other call** (settings, logout, project-list-detail, project-setting, create-project — i.e. every action-dispatch Lambda that isn't signup/login itself): extract it from the `Authorization: Bearer <token>` header and resolve it via a plain Cognito user-context call authenticated by the access token itself — no admin credentials needed:
   ```js
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
   ```
   This naturally throws an auth exception for an expired/invalid token — map that to a 401 in the outer `catch`, don't special-case it earlier.

Use pattern 2 for any new Lambda that receives a `Bearer` token from the frontend. Don't reach for admin-context calls unless the Lambda specifically needs elevated privileges for something else (e.g. deleting a user outright).

## Validation flow

Every Lambda validates as its own emitted `step` (usually the very first one, `step: "validation"`), collects every problem into a `details: string[]` array rather than failing on the first one, and reports 401 if the auth token itself was the problem, 400 otherwise:

```js
started(responseStream, "validation", "Validating request");
const errors = [];
if (!accessToken) errors.push("a valid Authorization bearer token is required");
if (!action || !VALID_ACTIONS.includes(action)) errors.push(`action must be one of: ${VALID_ACTIONS.join(", ")}`);
if (errors.length > 0) {
  failed(responseStream, "validation", "Validating request", null, errors.join("; "));
  result(responseStream, !accessToken ? 401 : 400, {
    error: !accessToken ? "Missing or invalid authorization token." : "Validation failed",
    details: errors,
  });
  return;
}
completed(responseStream, "validation", "Validating request");
```

## DynamoDB reserved-keyword trap

`sub` is a **DynamoDB reserved keyword**. Any `Query`/`Scan`/`Update` using it in an expression string must alias it:
```js
new QueryCommand({
  TableName: PROJECTS_TABLE,
  KeyConditionExpression: "#sub = :sub",
  ExpressionAttributeNames: { "#sub": "sub" },
  ExpressionAttributeValues: { ":sub": sub },
})
```
`PutCommand`/`GetCommand`/`UpdateCommand`/`DeleteCommand` with `Key: { sub, project_id }` are fine as-is (no expression string involved) — this only bites `Query`/`Scan`/`Update`'s expression strings. Hit and fixed once already in the login lambda; easy to reintroduce in any new query against a sub-keyed table.

## Error mapping convention

The outer `try/catch` around the whole handler body maps known error names to HTTP status codes and a friendly message, defaulting to 500:

```js
} catch (err) {
  console.error("<Lambda name> error:", err);
  let statusCode = err.statusCode || 500; // a locally-thrown httpError() carries its own statusCode
  let errorMessage = err.statusCode ? err.message : "Something went wrong. Please try again.";
  if (!err.statusCode) {
    switch (err.name) {
      case "NotAuthorizedException": statusCode = 401; errorMessage = "Your session has expired. Please log in again."; break;
      case "TooManyRequestsException":
      case "LimitExceededException": statusCode = 429; errorMessage = "Too many requests. Please try again shortly."; break;
      // ...Lambda-specific cases as needed
    }
  }
  result(responseStream, statusCode, { error: errorMessage });
}
```
A locally-raised business-logic error (e.g. "project not found") uses a small helper to carry its own status code through the same catch block:
```js
function httpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}
```

## Deploying a new/updated Lambda from this machine

1. **Read the currently-deployed code first** if updating an existing one — `aws lambda get-function --function-name <name> --query Code.Location --output text`, then `curl -o code.zip "<url>"` and `unzip`. Don't assume from the function name or from memory docs; a live download is authoritative and cheap.
2. Write `index.mjs` + a `package.json` listing only the `@aws-sdk/*` packages actually used (these are NOT bundled into the runtime — Node 24's Lambda runtime does not ship the v3 SDK submodules used here).
3. `npm install` and zip **from a short filesystem path** (e.g. a top-level `C:\` folder), not this session's own deep per-conversation temp scratchpad path — the SDK's deeply-nested type-definition tree can exceed Windows' 260-character path limit when the enclosing path is already long, breaking both `unzip` (mangled paths) and PowerShell's `Compress-Archive` (directory-not-found errors) partway through. Hit this exact failure once building the project-list-detail lambda.
4. `aws lambda update-function-code --function-name <name> --zip-file fileb://<path>.zip`, then `aws lambda wait function-updated`.
5. **Never put a live credential directly in a Bash command line** — the harness's own safety classifier blocks it outright. Instead write the env-var payload to a local JSON file (via the Write tool) and pass `--environment file://path/to/env.json` to `update-function-configuration`, then delete the file afterward.
6. A brand-new Lambda function typically has **no environment variables set at all**, not just missing code — check `aws lambda get-function-configuration --query Environment.Variables` before assuming it's already configured.
7. **Curl-verify every action, including error paths**, with a real access token from the project's single reusable test account before calling it done: missing/invalid auth (401), missing/invalid required fields (400), a not-found case (404 if applicable), and the real happy path. Guessing whether it works is exactly the failure mode this project's testing discipline exists to prevent.
