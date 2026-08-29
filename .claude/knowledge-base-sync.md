# Knowledge Base Sync (S3 + Bedrock)

How Xlya's per-project RAG knowledge base is populated and kept in sync. Confirmed against the real deployed `xlya-dev-users-project-setting-lambda` (which introduced this pattern) and the `xlya-dev-users-create-project-lambda` build that reused it — see `lambda-logic.md` for the general Lambda conventions this sits on top of, and `aws-resources.md` for the concrete resource IDs.

## The moving pieces

- **S3 bucket** `xlya-dev-s3` — every project's files live under the prefix `projects/{sub}/{project_id}/`.
- **Bedrock Knowledge Base** (`Z3PUCM3AG4`), data source (`SVMD6PMKNP`) — a `MANAGED_KNOWLEDGE_BASE_CONNECTOR` type watching that whole `projects/` S3 prefix, `dataDeletionPolicy: DELETE` (deleting the S3 object removes its vector too), `metadataFilesPrefix: "projects/"`.
- The KB's `knowledgeBaseConfiguration.type` is `MANAGED` with `embeddingModelType: MANAGED` — AWS operates its own internal vector storage for this tier. An earlier session's memory noted a separate `xlya-dev-vector-s3` bucket that existed but wasn't wired into anything — as of 2026-08-29, `aws s3api list-buckets` shows only `xlya-dev-s3` in this account/region, so that bucket appears to no longer exist (deleted, or never actually in this account). Don't assert it exists without re-checking `list-buckets` first. The specific embedding model isn't exposed by any Bedrock API for this KB type either (checked `get-knowledge-base` and a real `get-ingestion-job` response) — the honest answer if asked is "AWS-managed, opaque," not a guessed model name.

## Every object needs a metadata sidecar

Bedrock's S3 data source requires a matching `<key>.metadata.json` sidecar next to every content object (that's what `metadataFilesPrefix` points at). All attributes are `includeForEmbedding: false` — they're for future filtered retrieval by `project_id`, not meant to influence the embedding itself:

```js
function metadataSidecarBody({ project_id, sub, document_id, source_type }) {
  return JSON.stringify({
    metadataAttributes: {
      project_id: { value: { type: "STRING", stringValue: project_id }, includeForEmbedding: false },
      sub: { value: { type: "STRING", stringValue: sub }, includeForEmbedding: false },
      document_id: { value: { type: "STRING", stringValue: document_id }, includeForEmbedding: false },
      source_type: { value: { type: "STRING", stringValue: source_type }, includeForEmbedding: false },
    },
  });
}

async function putObjectWithSidecar({ key, body, contentType, metaAttrs, extraMetadata }) {
  await s3Client.send(new PutObjectCommand({ Bucket: PROJECTS_BUCKET, Key: key, Body: body, ContentType: contentType, ...(extraMetadata ? { Metadata: extraMetadata } : {}) }));
  await s3Client.send(new PutObjectCommand({ Bucket: PROJECTS_BUCKET, Key: `${key}.metadata.json`, Body: metadataSidecarBody(metaAttrs), ContentType: "application/json" }));
}
```

`source_type` values in use so far: `"description"` (the project's free-text description field), `"document"` (a user-uploaded PDF/TXT/DOCX/PPT file), `"website"` (the auto-generated business-profile document from website analysis — see below).

Deleting an object should best-effort delete its sidecar too, but never fail the whole action if the sidecar delete errors — the content object being gone is what actually matters; a leftover sidecar with no content object is harmless clutter.

## Syncing is a blocking `StartIngestionJob` + poll, by explicit design choice

`StartIngestionJob` is async. Rather than fire-and-forget, every mutating action **blocks** on it, emitting heartbeat `step` events (`status: "started"`, same step id, re-emitted) roughly every 4 seconds so the NDJSON connection visibly stays alive during the wait instead of going silent:

```js
const INGESTION_POLL_INTERVAL_MS = 4000;
const INGESTION_MAX_WAIT_MS = 600000; // 10 minutes

async function syncKnowledgeBase(responseStream, parentStep) {
  started(responseStream, "sync_kb", "Syncing knowledge base", parentStep);
  let jobId;
  try {
    const startRes = await bedrockClient.send(new StartIngestionJobCommand({ knowledgeBaseId: KB_ID, dataSourceId: KB_DATA_SOURCE_ID }));
    jobId = startRes.ingestionJob.ingestionJobId;
  } catch (err) {
    // A ConflictException means a job is already running (a concurrent
    // mutation) — wait on that one instead of erroring out.
    if (err.name === "ConflictException") {
      const list = await bedrockClient.send(new ListIngestionJobsCommand({
        knowledgeBaseId: KB_ID, dataSourceId: KB_DATA_SOURCE_ID,
        filters: [{ attribute: "STATUS", operator: "EQ", values: ["IN_PROGRESS"] }], maxResults: 1,
      }));
      jobId = list.ingestionJobSummaries?.[0]?.ingestionJobId;
      if (!jobId) throw err;
    } else {
      throw err;
    }
  }

  const deadline = Date.now() + INGESTION_MAX_WAIT_MS;
  let status = "IN_PROGRESS";
  while (Date.now() < deadline) {
    const jobRes = await bedrockClient.send(new GetIngestionJobCommand({ knowledgeBaseId: KB_ID, dataSourceId: KB_DATA_SOURCE_ID, ingestionJobId: jobId }));
    status = jobRes.ingestionJob.status;
    if (status === "COMPLETE" || status === "FAILED" || status === "STOPPED") break;
    emit(responseStream, { type: "step", step: "sync_kb", parent: parentStep, status: "started", label: "Syncing knowledge base…" });
    await new Promise((r) => setTimeout(r, INGESTION_POLL_INTERVAL_MS));
  }

  if (status === "COMPLETE") { completed(responseStream, "sync_kb", "Syncing knowledge base", parentStep); return { warning: null }; }
  const warning = status === "IN_PROGRESS"
    ? "Knowledge base sync is taking longer than expected and is still running in the background."
    : `Knowledge base sync ended with status: ${status}.`;
  failed(responseStream, "sync_kb", "Syncing knowledge base", parentStep, warning);
  return { warning };
}
```

**A sync failure/timeout is reported as a warning (`kbSyncWarning` in the result body), never a hard failure** — the S3/DynamoDB writes have already happened by the time `syncKnowledgeBase` runs, so the underlying data is durably saved either way; the KB search index just might lag behind briefly.

Real observed timing: a single ingestion run over a small per-project prefix commonly takes 90-150+ seconds end to end (confirmed live both for a manually-added description/file and for the create-project lambda's auto-generated document) — size your Lambda timeout and frontend inactivity timeout well above that, not against a "typical" guess.

## Size/format constraints worth remembering

- Lambda **Function URLs** (not API Gateway) base64-encode any binary request body before the handler ever sees it — that inflation happens at the invocation layer regardless of raw-bytes-vs-base64 transport choice, so the real ceiling under the 6MB synchronous payload cap is **~4MB**, not whatever the KB data source's own filter config would otherwise allow. This only applies to Lambdas invoked via Function URL with a binary body (file uploads); it doesn't affect plain-JSON-body Lambdas behind API Gateway.
- Allowed uploaded file extensions (project-setting lambda's `add_file`): `pdf`, `txt`, `docx`, `ppt`, `pptx`. Max 5 files per project.

## Content policy: distill, don't dump

**As of 2026-08-29, the create-project lambda's website-derived KB document is a distilled, on-topic business profile — not a raw dump of scraped page text.** This was an explicit, deliberate requirement: the knowledge base should only contain information relevant to growth, marketing, business strategy, and freelance/portfolio positioning for that specific business — not navigation menus, legal boilerplate, or unrelated page filler that a raw HTML-to-text scrape would otherwise include.

Implementation: after crawling and parsing the site's pages (see `aws-resources.md`'s NVIDIA section for the model/timeout details, shared with ICP/competitor generation), one additional NVIDIA chat-completion call is made — plain-text output, no `response_format: json_object` constraint (that's specific to the ICP/competitors call) — explicitly instructed to write only what's relevant to growth/marketing/business/freelance, as flowing prose, capped at ~400 words, with an explicit fallback (title + meta description + ICP target audience, never the full raw page text) if that call fails after its retry budget. This distilled text is what actually gets written to S3 and synced into the KB — **if this pattern is copied for another content source, keep the "distill via a scoped-prompt LLM call, never store the raw scrape" rule**, don't quietly revert to storing raw parsed page content to save an API call.
