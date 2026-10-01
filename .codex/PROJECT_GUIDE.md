# Xlya Frontend — Project Guide

This guide records the repository structure, product flows, backend contracts, and implementation constraints reviewed so far. It is a working map, not a substitute for checking the current source. **When this guide or another note disagrees with runtime code, inspect and follow the code; then update the docs that became stale.**

## Project at a glance

- Next.js App Router application in `src/app`, using React 19 and TypeScript.
- UI combines Tailwind CSS and MUI. Redux Toolkit and RTK Query handle shared state and API slices.
- Product: Xlya, a business-growth platform with onboarding, project analysis, dashboard tools, and a vibe-prospecting agent.
- Most application data and auth operations are handled by remote AWS Lambda endpoints. The Next.js app also has local API routes for contact email and agent XLSX export.
- Package scripts: `dev`, `build`, `start`, and `lint`. Project instructions prohibit starting the dev server independently; the user runs it.

## Routes and major screens

- `/`: landing page assembled from `src/components/landingPage/` (`Navbar`, `Hero`, strategy/growth/marketing/operations sections, testimonials, final CTA, footer). Its theme toggle is scoped to the landing page.
- `/onboarding`: anonymous, four-step questionnaire: business type, challenge, team size, and website URL. Answers are stored in session storage and handed to signup.
- `/auth/signup`, `/auth/login`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password`: account creation, sign-in, email verification, and password recovery.
- `/dashboard`: project overview, market analysis, and live activity.
- `/dashboard/apps`: Apps catalog with a split-view Lead Calculator detail/workspace; supports forward and reverse funnel planning, displays a stage-by-stage funnel graphic and monthly lead plan chart, and calls the deployed lead-calculator Lambda. Scenarios are not persisted.
- `/dashboard/project`: current project details, description and document management.
- `/dashboard/agents`: Vibe Prospecting chat and job history.
- `/dashboard/settings`: profile, onboarding settings, password/account actions, and related preferences.
- `/dashboard/mcp/callback`: Vibe Prospecting OAuth/MCP callback.
- `/pricing`, `/privacy-policy`, `/terms-of-service`: public product/legal pages.
- `src/app/api/contact/route.ts`: Resend-backed contact submission endpoint (currently not used by the redesigned landing page).
- `src/app/api/agents/export-xlsx/route.ts`: server-side CSV-to-XLSX conversion for agent exports.

## Runtime composition and UI conventions

- `src/app/layout.tsx` loads global CSS and fonts (Fjalla One, Fraunces, DM Sans), mounts `KineticGrid` once, and composes Amplify, theme, Redux, and toast providers.
- `KineticGrid` is a global fixed canvas. Do not mount it again on individual pages. Opaque landing-page sections intentionally obscure it; on other screens, avoid adding opaque backgrounds to page-level wrappers unless the visual result is intended.
- Shared UI includes `Button`, `GetStartedButton`, `Logo`, `AppNavbar`, `MiniTerminal`, and onboarding components. Landing page styles and theme are isolated under `components/landingPage`.
- The landing page and authenticated dashboard use `LandingThemeProvider` with a deliberate light/dark toggle. App pages should use `useLandingTheme()` tokens for both themes.
- Navbar create/delete project dialogs use portals because the animated navbar's transform changes fixed-position descendants' containing block.

## Authentication and state

- Redux store: `src/redux/store.ts`; auth slice and RTK Query APIs: `src/redux/services/auth/auth.ts`, `profileInfo.ts`, and `baseApi.ts`.
- Auth state hydrates synchronously from `localStorage.UserData` on the client so protected routes can decide before rendering. `ProtectedRoute` gates dashboard routes and logs out expired sessions.
- Persisted auth tokens are limited to `{ accessToken, expiresAt }`; the expiry is derived from JWT `exp`. Do not persist ID or refresh tokens. Ephemeral project list/activity state is fetched again rather than persisted.
- API clients do not all authenticate the same way. `baseApi.ts` currently sends the Cognito user ID as `Authorization`; the stream clients generally send a bearer access token. Check the specific client and backend contract before changing headers.
- Amplify configuration exists in both `src/lib/aws/amplify.ts` and `src/components/providers/AmplifyConfigProvider.tsx`, and the configured pool/client IDs differ. Current signup/login use custom Lambda stream clients rather than Amplify's direct mutations. If touching auth or Amplify, establish which configuration is actually consumed before editing either copy.

## Signup and onboarding contract

Flow: Get Started → `/onboarding` → `/auth/signup` → paced progress UI → `/dashboard`.

- Onboarding is anonymous and does not auto-redirect based on auth state.
- Each option has a display `label` and API `value`. Always submit/select `value`, never the label.
- Website is the fourth step. The Next/Finish action requires a non-empty URL; the explicit skip link is the only way to continue without one.
- Answers use `ONBOARDING_ANSWERS_STORAGE_KEY` in `sessionStorage` and are merged into the signup request once at submission.
- `src/lib/api/signupStream.ts` posts to the combined signup/onboarding endpoint. It creates the account, confirms/signs in, saves onboarding data, creates the initial project, and optionally analyzes the website.
- Confirmed request enums: `businessType`: `ecommerce | saas | agency | creator | local | other`; `challenge`: `content | leads | ops | scale`; `teamSize`: `solo | small | medium`; `gender`: `male | female | prefer_not_to_say`.
- Signup response uses **NDJSON**, one plain JSON object per newline, not SSE. `step` events report activity; the final `result` event's `statusCode` decides success/failure. A failed intermediate step may be non-fatal.
- API Gateway may deliver all signup NDJSON at once. Transport parsing should not add artificial delays; visual pacing belongs to signup UI/`LoadingScreen`.
- Signup stream uses an inactivity timeout so a stalled request can surface to the UI.
- The older per-question onboarding RTK Query endpoint is legacy/dead code; do not wire it back into this flow without a deliberate contract change.

## Projects and dashboard

- `projectListStream.ts` calls the project list/detail Lambda: `action: "list"` returns lightweight summaries, and `action: "get"` returns a caller-scoped full project row.
- `AppNavbar` loads projects, chooses the selected/default/first project, and dispatches project changes into Redux. This selected project is the shared context for project-scoped views and API calls.
- Project state includes analysis fields such as website information, Lighthouse metrics, ICP, and competitors. `MarketAnalysis` renders Lighthouse, ICP, and competitor information; it filters the project's own name from competitor results.
- Streamed activity is reflected in `auth.projectActivity` and shown as the most recent line in the dashboard's `MiniTerminal`.
- Create-project flow accepts a website URL, derives a name from the domain, analyzes up to five same-domain pages, generates a business profile, and makes the new project the default. In the UI the modal closes immediately, activity streams into the shared activity state, and success refreshes project selection/list.
- Project-setting content supports project descriptions and document operations. Files and the current description are stored under the project's S3 prefix, with Knowledge Base synchronization described below.

## Agent screen and export behavior

- The Vibe Prospecting screen uses a two-pane fixed-height layout with its own sidebar and chat area. State is local to the page rather than persisted in Redux.
- Agent client: `src/lib/api/vibeProspectingAgentStream.ts`, using a Lambda Function URL and NDJSON. It includes `step`, `message`, and `result` event shapes; the UI renders reply content from `result` to avoid duplicate chat bubbles.
- `run_template` runs its template workflow directly; free text uses `chat` and may pause for confirmation/refinement between stages. Other actions include loading/listing jobs and project welcome behavior.
- The UI currently enforces one Vibe Prospecting job per project. Starting another search requires changing projects. Job history may not provide a fresh presigned export URL, so expired links are represented as unavailable.
- CSV downloads use the Lambda presigned URL. XLSX goes through the same-origin Next.js route, which fetches CSV server-side (the S3 bucket lacks browser CORS) and converts it using `exceljs`. The route allowlists the expected S3 hostname to avoid acting as an open proxy.

## AWS API and Lambda conventions

- Frontend API stream clients live in `src/lib/api/`; endpoint URLs are currently hard-coded there. Relevant clients include signup, login, logout, forgot password, email verification, settings, integrations status, project list/detail, create project, project content, Vibe Prospecting, the agent chat Lambda, and lead-calculator calculations.
- Most user APIs use API Gateway in `us-east-1`; project content and Vibe Prospecting use Function URLs. These are not interchangeable: verify each route's auth, CORS, payload, and streaming behavior before changing a client.
- Lambda response bodies use NDJSON: bare JSON objects separated by `\n`, with `step` events and one final `result`. Do not parse as SSE. The final result status is authoritative; some failed steps are warnings/non-fatal.
- For Function URLs, CORS/OPTIONS behavior differs from API Gateway. Consult `.claude/lambda-logic.md` before implementing or changing Lambda clients/handlers.
- `sub` is a DynamoDB reserved word in expression strings; alias it (for example `#sub`). The Lambda notes cover token-to-user resolution, validation, error mapping, streaming response setup, and CORS details.
- Website analysis uses an NVIDIA API in backend Lambdas. Bedrock is used for the S3-backed Knowledge Base ingestion flow, not as the current website-analysis LLM. Do not assume AWS resource inventory or deployed Lambda behavior is current without verification.

## Knowledge Base and project files

- Project objects use S3 prefix `projects/{sub}/{project_id}/` in bucket `xlya-dev-s3`; DynamoDB project rows store S3 key strings for documents.
- Every content object has a matching `.metadata.json` sidecar with project/user/document/source metadata. Current source types include description, uploaded document, and website profile.
- Mutations start a Bedrock Knowledge Base ingestion job and poll it. Ingestion failure/timeout is a warning because the underlying S3/DynamoDB update may already be saved.
- Website-derived knowledge content should be distilled into an on-topic business profile (growth, marketing, strategy, freelance/portfolio context), not copied as raw scraped page text.
- Function URL uploads have a tighter practical payload ceiling due to base64 expansion. The documented file types are PDF, TXT, DOCX, PPT, PPTX; the documented per-project maximum is five.

## Live Lambda integration check (2026-09-30)

Read-only AWS CLI checks confirmed account `492427341392` in `us-east-1` (the caller identity was the account root user). Thirteen Lambda functions with `xlya` in their names were listed. Ten have API Gateway POST routes, two have Function URLs used by this frontend, and one additional Function URL belongs to the lead calculator.

| Lambda | Frontend connection | Status |
|---|---|---|
| `xlya-dev-users-signup-lambda` | `signupStream.ts` → `/auth/signup` | Integrated |
| `xlya-dev-users-login-lambda` | `loginStream.ts` → `/auth/login` | Integrated |
| `xlya-dev-users-forgot-password-lambda` | `forgotPasswordStream.ts` → `/auth/forgot-password` | Integrated |
| `xlya-dev-users-logout-lambda` | `logoutStream.ts` → `AppNavbar` | Integrated |
| `xlya-dev-users-settings-lambda` | `settingsStream.ts` → settings page/navbar/account actions | Integrated |
| `xlya-dev-users-email-verification-lambda` | `emailVerificationStream.ts` → verification gate/page | Integrated |
| `xlya-dev-users-project-list-detail-lambda` | `projectListStream.ts` → `AppNavbar` project selection | Integrated |
| `xlya-dev-users-create-project-lambda` | `createProjectStream.ts` → `AppNavbar` | Integrated |
| `xlya-dev-users-integrations-connection-status-lambda` | `integrationsStatusStream.ts` → connector drawer | Integrated |
| `xlya-dev-users-vibe-prospecting-oauth-lambda` | `vibeProspectingStream.ts` → connector drawer and OAuth callback | Integrated |
| `xlya-dev-users-project-setting-lambda` | `projectContentStream.ts` → project details/content page | Integrated via Function URL |
| `xlya-dev-users-vibe-prospecting-lambda` | `vibeProspectingAgentStream.ts` → agents page | Integrated via Function URL |
| `xlya-dev-users-lead-calculator-lambda` | `leadCalculatorStream.ts` → `/dashboard/apps` Lead Calculator workspace | Integrated; forward/reverse calculation, streamed NDJSON result |

The live API Gateway resource list contained the ten matching POST routes. At the initial lead-calculator audit, its Function URL used `AuthType: NONE` and `RESPONSE_STREAM`, had no Lambda URL CORS configuration, and had a resource policy granting `Principal: *` invocation. On 2026-09-30 CORS was configured for origin `*`, method `POST`, headers `authorization` and `content-type`, with a 600-second preflight cache. Its shared execution role includes `AdministratorAccess`, `AmazonDynamoDBFullAccess`, and `AmazonS3FullAccess`. On 2026-09-30 the code package described below was deployed; the Function URL auth policy and execution role were not changed. The authenticated Function URL was not invoked during the initial AWS inventory check; authenticated forward/reverse requests were exercised on 2026-10-01 (see below). The live `xlya` function list did not include the `xlya-dev-users-dashboard-lambda` described in the older `.claude/aws-resources.md` snapshot, so verify live state before relying on that note.

### Lead calculator (deployed and integrated; local source folder removed by user)

The Node.js 24, dependency-free package was uploaded to `xlya-dev-users-lead-calculator-lambda`; Lambda reported `LastUpdateStatus: Successful`. The handler authenticates Cognito bearer access tokens through Cognito `GetUser`, accepts schema version 1 calculation requests, and returns NDJSON step/result events. It does not accept client-supplied user/project IDs or persist scenarios. The user later removed the local `lambda_lead_calculator/` folder; do not assume its source or deployment archive is available in the repository.

The deployed calculation engine supports forward and reverse funnels; stage-to-stage and optional per-channel conversion rates; fractional expected stage volumes; ceiling-based reverse lead requirements reconciled against integer channel allocation; revenue, cost-per-lead CAC and subscription payback estimates; caller-supplied benchmarks; sensitivity bands; stage-owner labels and duration assumption flags; seasonal monthly lead allocation; simple rep quotas; lead/account equivalents; and a separately reported re-engagement estimate excluded from primary revenue. It does not import or analyze actual leads, persist scenarios, model new-logo and expansion funnels separately, or source industry benchmarks. Review those boundaries before exposing the feature as a complete planning product.

The function still uses its shared `AdministratorAccess` execution role and public Function URL resource policy; those were left unchanged. Despite that broad role, the deployed handler performs no S3 or DynamoDB operations and does not save calculation inputs/results. It does call Cognito `GetUser` to validate the caller's access token. The Function URL CORS configuration allows `*`, POST, and Authorization/Content-Type. A CORS preflight and unauthenticated POST were checked on 2026-09-30; preflight succeeded and the POST returned the handler's NDJSON 401. Duplicate `Access-Control-Allow-Origin` was corrected and redeployed. On 2026-10-01, the supplied verified Xlya account successfully authenticated and made forward/reverse requests: 100 leads at 20% conversion and $1,000 deal value returned 20 expected customers / $20,000 expected revenue; a $10,000 reverse target returned 50 leads / 10 expected customers. Do not record its password or access tokens in project files.

The frontend client is `src/lib/api/leadCalculatorStream.ts`; it submits `{ action: "calculate", schemaVersion: 1, scenario }` to the deployed Function URL with the Cognito access token as a bearer credential and parses the final NDJSON result. The Apps page at `src/app/(pages)/dashboard/apps/page.tsx` contains the catalog/detail split view and calculator. The workspace displays KPI cards, a funnel-stage SVG graphic, and a month-by-month lead allocation chart using values returned by the Lambda. It is responsive and theme-aware through `useLandingTheme()`. Calculation results remain in page memory only. User removed the backend source folder after deployment, so backend changes require recovering/recreating its source package.

The active shell initially lacked visibility into the Windows profile; elevated read-only checks confirmed the AWS CLI works. Previous notes in this section that said the CLI was unavailable are superseded by this check. No AWS service resources were changed during the project audit.

## Relevant project notes

The repository's `.claude/` folder contains deeper references:

- `folder-structure.md`: architecture snapshot and detailed product-flow notes.
- `aws-resources.md`: historical AWS resource inventory.
- `lambda-logic.md`: Lambda streaming, auth, validation, CORS, and error conventions.
- `knowledge-base-sync.md`: S3 sidecars and Bedrock ingestion behavior.

Read the relevant sections before changing these areas, then confirm the current implementation. Do not start the Next.js development server yourself; the user runs it.
