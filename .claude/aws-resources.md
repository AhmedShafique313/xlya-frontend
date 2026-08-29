# AWS Resources (us-east-1)

Inventory of every AWS resource this project's backend actually uses, all in **us-east-1**, all under account `492427341392`. Compiled by querying live AWS state directly (`aws lambda list-functions`, `aws apigateway get-resources`, `aws dynamodb describe-table`, etc.) on 2026-08-29 — treat this as a snapshot, re-verify with the CLI before relying on any specific ID for something high-stakes, since resources can be added/removed/renamed between sessions without this file being updated in lockstep. See `lambda-logic.md` for the code-level conventions shared across the Lambdas below, and `knowledge-base-sync.md` for the S3+Bedrock KB details.

## AWS CLI on this machine

`aws.exe` is not on `PATH` in Bash/PowerShell tool sessions — it's installed per-user at:
```
C:\Users\Skibidi Rizz\AppData\Local\Programs\Amazon\AWSCLIV2\aws.exe
```
Call it by full path. Credentials/config are at `~/.aws/credentials` and `~/.aws/config` and work fine once invoked directly.

**Git Bash mangles any AWS CLI argument starting with `/`** (e.g. a CloudWatch log group name) into a Windows path via MSYS path-conversion, producing confusing `InvalidParameterException`/`AccessDeniedException` errors that look server-side. Set `MSYS_NO_PATHCONV=1` before any such command (or prefix it: `MSYS_NO_PATHCONV=1 aws logs ...`).

## Cognito

- **User pool**: `us-east-1_QVY45GkDF`
- **App client**: `7g2v6cug33o2soil5s5eoi03t` — **has a client secret** (so browser-side Amplify Auth can't use it directly for `signIn`/`signUp`; that's why the frontend calls the signup/login Lambdas instead of Amplify's own auth mutations for those flows). `PreventUserExistenceErrors: ENABLED` (so `AdminInitiateAuth` throws the same error for "wrong password" and "no such user" — Lambdas that need to tell those apart do an explicit `AdminGetUser`/`GetUser` existence check first). Auth flows enabled: `ALLOW_ADMIN_USER_PASSWORD_AUTH`, `ALLOW_REFRESH_TOKEN_AUTH`, `ALLOW_USER_SRP_AUTH`.
- Email delivery uses `COGNITO_DEFAULT` sending (switched from the SES sandbox, which was blocking verification emails to unverified recipient addresses).
- Only **one Cognito test account is meant to exist at a time** for manual testing — reuse it via the login Lambda rather than creating new ones (see the project's `feedback_reuse_single_test_user` memory for the reasoning). As of 2026-08-29 the pool actually has 5 confirmed users from various past sessions, not strictly one — don't add a 6th without a reason.

## DynamoDB

Two tables, both in us-east-1:

- **`xlya-dev-onboarding-table`** — key schema: `sub` (HASH) only. Stores the original 3-question onboarding answers (`businessType`, `challenge`, `teamSize`) plus profile fields (`phoneNumber`, `profileImageData`/`profileImageContentType` as DynamoDB Binary — no S3 for the profile photo).
- **`xlya-dev-projects-table`** — key schema: `sub` (HASH) / `project_id` (RANGE), i.e. **one account can hold multiple project rows**, queried by `sub` alone to list them all. Columns actively used: `project_name`, `website_url`, `project_onboarding_status` (bool, reserved for a not-yet-built project-configuration-complete flow), `project_space` (reserved, unused), `isDefault` (bool — exactly one project per `sub` should have this `true` at a time; the create-project Lambda flips the previous default to `false` before writing the new one as default), `created_at`/`updated_at`, `description` (string, from the project-setting Lambda), `documents_path` (list of plain S3 key strings — no rich metadata stored in the DB row itself, per explicit design choice; display fields like size/added-date are derived live via S3 `HeadObject`), and the website-analysis fields `website_information`, `lighthouse_metrics`, `icp`, `competitors` (all nullable, populated only when a website URL was given/crawled successfully).
- **`sub` is a DynamoDB reserved keyword** — any `Query`/`Scan`/`Update` referencing it in an expression string needs `ExpressionAttributeNames: { "#sub": "sub" }`. See `lambda-logic.md`.

## S3

- **`xlya-dev-s3`** — the only project-data bucket that currently exists (confirmed via `list-buckets` 2026-08-29). Prefix structure: `projects/{sub}/{project_id}/{document_id}.{ext}` for every knowledge-base content object, each with a matching `{key}.metadata.json` sidecar (see `knowledge-base-sync.md`). `description.txt` is a fixed filename (not a random `document_id`) for the project's free-text description field specifically.

## Bedrock

- **Knowledge Base** `Z3PUCM3AG4` (`xlya-dev-knowledgebase`), **data source** `SVMD6PMKNP` (`xlya-dev-users-project-data-source`) — `MANAGED_KNOWLEDGE_BASE_CONNECTOR` watching the `xlya-dev-s3` bucket's `projects/` prefix, `dataDeletionPolicy: DELETE`. `knowledgeBaseConfiguration.type: MANAGED` / `embeddingModelType: MANAGED` — AWS-operated storage and embedding model, not user-configurable or discoverable via any Bedrock API on this KB tier.
- **On-demand model invocation (the original signup design) is not usable here** — the account's Bedrock on-demand token quota is stuck at 0 (an AWS Support case would be needed to raise it), which is *why* ICP/competitor generation moved to NVIDIA's API instead (see below). If Bedrock quota is ever raised, that's a deliberate future migration, not something to silently revert to.

## NVIDIA (external, not AWS, but core to the backend)

- Endpoint: `https://integrate.api.nvidia.com/v1/chat/completions` — OpenAI-compatible chat completions API, called via plain `fetch`, no `openai` npm package.
- Model: `openai/gpt-oss-20b` (env var `NVIDIA_MODEL_ID`, overridable). `openai/gpt-oss-120b` was tried first and measured at ~75s for a trivial reply — unusable inside any of these request/response Lambda flows regardless of the Lambda's own timeout, because it's a reasoning model whose `reasoning_content` trace eats into `max_tokens` before the final answer, and its raw latency alone blows past every reasonable integration timeout.
- The 20b model is still NVIDIA's shared free-tier endpoint and shows real latency variance in production use (observed 1-8s typical, occasional 15-30s+ stalls) — every call site retries (2-3 attempts) against its own generous per-call timeout (25-30s) rather than assuming a single fast response.
- The API key is stored only as Lambda environment variables (`NVIDIA_API_KEY`) on whichever Lambdas call it — never committed to this repo, never printed in a shell command (the harness's safety classifier blocks that outright; write env-var payloads to a local JSON file instead, see `lambda-logic.md`).
- Two distinct NVIDIA call shapes exist: a `response_format: { type: "json_object" }`-constrained call for ICP/competitor generation (strict JSON output, with a narrow bracket-mismatch repair pass for the one observed malformed-JSON failure mode), and a plain-prose call (no format constraint) for the create-project Lambda's distilled KB business-profile document — see `knowledge-base-sync.md`.

## API Gateway

- **REST API** `q1qhgitk2a` (`Xlya-Dev-Rest-API`), stage `dev`. Base URL: `https://q1qhgitk2a.execute-api.us-east-1.amazonaws.com/dev`.
- Every route below is `AWS_PROXY` integration type, pointed at `.../functions/<lambda-arn>/response-streaming-invocations` with `responseTransferMode: STREAM`, `POST` + `OPTIONS` methods (`OPTIONS` answered by a separate `MOCK` integration, never reaching the Lambda). Integration timeout is `900000` ms (900s) on every route below, raised from the API Gateway default of 29000 ms specifically so the NVIDIA-calling routes have room:

  | Path | Backing Lambda |
  |---|---|
  | `/xlya-dev-users-signup-api` | `xlya-dev-users-signup-lambda` |
  | `/xlya-dev-users-login-api` | `xlya-dev-users-login-lambda` |
  | `/xlya-dev-users-logout-api` | `xlya-dev-users-logout-lambda` |
  | `/xlya-dev-users-forgot-password-api` | `xlya-dev-users-forgot-password-lambda` |
  | `/xlya-dev-users-settings-api` | `xlya-dev-users-settings-lambda` |
  | `/xlya-dev-users-email-verification-api` | `xlya-dev-users-email-verification-lambda` |
  | `/xlya-dev-users-project-list-detail-api` | `xlya-dev-users-project-list-detail-lambda` |
  | `/xlya-dev-users-create-project-api` | `xlya-dev-users-create-project-lambda` |

- **`xlya-dev-users-project-setting-lambda` is the one exception** — it has no API Gateway route at all. The frontend calls it directly via its Lambda **Function URL** (`InvokeMode: RESPONSE_STREAM`), since it needs `multipart/form-data` support for file uploads that a REST API route would complicate. See its Function URL CORS gotcha in `lambda-logic.md`.

## Lambda functions

All Node.js 24.x (except one Python stub), all sharing one IAM role: `arn:aws:iam::492427341392:role/xlya-dev-lambda-role` (covers Cognito, DynamoDB, S3, and Bedrock Agent permissions — new Lambdas added to this account so far have not needed a new/narrower role).

| Function | Purpose | Notes |
|---|---|---|
| `xlya-dev-users-signup-lambda` | Account creation + first project creation, with website crawl/ICP/lighthouse if a URL is given | The most complex Lambda; source of the crawl/NVIDIA/lighthouse logic reused elsewhere |
| `xlya-dev-users-login-lambda` | Email/password login, returns the account's project | |
| `xlya-dev-users-logout-lambda` | `GlobalSignOut` | |
| `xlya-dev-users-forgot-password-lambda` | 3-step reset-password wizard backend | Only works once the email is already verified (deliberate) |
| `xlya-dev-users-settings-lambda` | Profile get/update, photo upload/delete, password change, delete-account | `delete_account` also wipes every project row for that `sub` |
| `xlya-dev-users-email-verification-lambda` | Cognito native email-attribute verification | |
| `xlya-dev-users-project-setting-lambda` | Per-project description/file CRUD + KB sync + whole-project delete | Function URL, not API Gateway; the only multipart-body Lambda |
| `xlya-dev-users-project-list-detail-lambda` | List all of an account's projects; fetch one project's full record | Built 2026-08-29 — was an empty default-template stub despite having a live API Gateway route already configured; don't assume a Lambda has real logic just because its route/infra exists |
| `xlya-dev-users-create-project-lambda` | Create an additional project from a website URL: crawl (5 pages), NVIDIA ICP/competitors, heuristic lighthouse scoring, KB sync of a distilled business-profile document, flips the account's previous default project to non-default | Built 2026-08-29, same "stub despite live route" situation as above |
| `xlya-dev-users-dashboard-lambda` | Unused | Still the default Python "Hello from Lambda!" template as of 2026-08-29 — not wired to any frontend code or API Gateway route found. Check this one first before assuming a brand-new Lambda is needed for a dashboard-related backend feature. |

**A Lambda having a live, fully-configured API Gateway route (or Function URL) is not evidence that its code does anything** — two Lambdas in this list (`project-list-detail`, `create-project`) had complete infra wired up by the user well before their actual logic was built. Always download and read `Code.Location`'s actual deployed source before assuming a Lambda "already exists" and works.
