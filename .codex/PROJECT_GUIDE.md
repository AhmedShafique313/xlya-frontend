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
- The landing page has a deliberate light/dark toggle; the rest of the application remains dark themed.
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

- Frontend API stream clients live in `src/lib/api/`; endpoint URLs are currently hard-coded there. Relevant clients include signup, login, logout, forgot password, email verification, settings, integrations status, project list/detail, create project, project content, Vibe Prospecting, and the agent chat Lambda.
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

## AWS CLI status checked in this session

- `aws` was not found in the active shell's PATH or the documented/common Windows install paths checked during this session, so no `aws --version` could be run.
- Credential-file checks were blocked by access denied; AWS credential environment variables were absent. Credential configuration therefore remains unverified.
- No AWS CLI configuration was changed and no AWS service calls were made for this check.
- `.claude/aws-resources.md` describes an earlier machine/resource snapshot. Treat its account IDs, names, and claims of configured credentials as historical notes, not live verification.

## Relevant project notes

The repository's `.claude/` folder contains deeper references:

- `folder-structure.md`: architecture snapshot and detailed product-flow notes.
- `aws-resources.md`: historical AWS resource inventory.
- `lambda-logic.md`: Lambda streaming, auth, validation, CORS, and error conventions.
- `knowledge-base-sync.md`: S3 sidecars and Bedrock ingestion behavior.

Read the relevant sections before changing these areas, then confirm the current implementation. Do not start the Next.js development server yourself; the user runs it.
