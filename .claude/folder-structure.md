# Xlya Frontend — Folder Structure

> **Before starting any work on this project**, read every file in the auto-memory directory for this project (`MEMORY.md` there is the index — it's auto-loaded into context each session, but skim the individual memory files it links to as well, not just the one-line summaries). Those memories capture hard-won, non-obvious facts — wrong-guess API enum values later corrected, a CSS stacking-context bug that looked like a completely different problem, exact wire-format gotchas — that aren't otherwise derivable from reading the code cold. Re-deriving them by trial and error costs real turns; reading them first doesn't. This doc (`.claude/folder-structure.md`) is the architecture snapshot; the memory files are the "why" and "what already went wrong once" behind it. Keep both updated as things change — memory entries especially should be corrected/superseded (not left stale) the moment a described behavior changes again.

Snapshot of the repository layout (excludes `node_modules`, `.next`, `.git`).

```
.
├── .gitattributes
├── .gitignore
├── README.md
├── eslint.config.mjs
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── logo.png
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
└── src/
    ├── app/
    │   ├── (pages)/
    │   │   ├── auth/
    │   │   │   ├── forgot-password/page.tsx
    │   │   │   ├── login/page.tsx
    │   │   │   ├── reset-password/page.tsx
    │   │   │   ├── signup/page.tsx
    │   │   │   └── verify-email/page.tsx
    │   │   ├── dashboard/
    │   │   │   ├── layout.tsx
    │   │   │   └── page.tsx
    │   │   ├── onboarding/page.tsx
    │   │   ├── privacy-policy/page.tsx
    │   │   └── terms-of-service/page.tsx
    │   ├── api/
    │   │   └── contact/route.ts
    │   ├── globals.css
    │   ├── icon.png
    │   ├── layout.tsx
    │   └── page.tsx
    ├── assets/
    │   └── images/
    │       ├── Logo4.png       # legacy image logo — superseded by the text-based Logo component
    │       ├── logo.png
    │       ├── logo2.jpg
    │       └── logo3.jpg
    ├── components/
    │   ├── auth/
    │   │   ├── AuthFeaturesSidebar.tsx
    │   │   └── ProtectedRoute.tsx  # gates /dashboard; also expires sessions past tokens.expiresAt
    │   ├── common/
    │   │   ├── Button.tsx           # shared form/CTA button (variant: primary | outline | ghost)
    │   │   ├── GetStartedButton.tsx # dedicated "Get Started" button matching Navbar's settings
    │   │   ├── KineticGrid.tsx      # site-wide animated bg canvas — mounted ONCE in app/layout.tsx, see below
    │   │   └── Logo.tsx             # shared text logo "XLYA" (Fjalla One font, X=gold, LYA=white)
    │   ├── landingPage/
    │   │   ├── AnnouncementBanner.tsx  # not currently rendered (removed from page.tsx)
    │   │   ├── Contact.tsx
    │   │   ├── Footer.tsx
    │   │   ├── Hero.tsx
    │   │   ├── Navbar.tsx
    │   │   ├── Pricing.tsx
    │   │   └── WhyTexalya.tsx
    │   ├── onboarding/
    │   │   ├── LoadingScreen.tsx  # signup page's live progress screen (see below) — NOT used by onboarding itself anymore
    │   │   ├── OptionCard.tsx     # presentational only; label for display, value is the answer
    │   │   ├── ProgressBar.tsx
    │   │   ├── QuestionStep.tsx   # passes opt.value (not opt.label!) to onSelect/isSelected
    │   │   └── WelcomeScreen.tsx
    │   ├── providers/
    │   │   └── AmplifyConfigProvider.tsx
    │   └── snakbar/
    │       ├── ToastProvider.tsx
    │       └── index.ts
    ├── constants/
    │   ├── colors.ts
    │   └── onboarding.ts   # ONBOARDING_ANSWERS_STORAGE_KEY — sessionStorage handoff, onboarding page → signup page
    ├── lib/
    │   ├── api/
    │   │   └── signupStream.ts  # combined signup+onboarding API client (NDJSON streaming, see below)
    │   ├── aws/
    │   │   └── amplify.ts
    │   └── utils.ts              # cn() (clsx + tailwind-merge) — added for KineticGrid, not a shadcn adoption
    ├── redux/
    │   ├── hooks.ts
    │   ├── provider.tsx
    │   ├── services/
    │   │   ├── auth/
    │   │   │   ├── auth.ts       # tokens = { accessToken, expiresAt } only — no idToken/refreshToken persisted
    │   │   │   └── profileInfo.ts
    │   │   ├── baseApi.ts
    │   │   └── onboarding/
    │   │       └── onboarding.ts  # OLD questionnaire API — unused, kept for reference (see notes below)
    │   └── store.ts
    └── utils/
        ├── jwt.ts              # getJwtExpiryMs() — decodes a JWT's exp claim to ms-epoch
        ├── theme-injector.ts
        └── theme-provider.tsx
```

## Notes
- Next.js App Router project (`src/app`), route groups under `(pages)` for auth, dashboard, onboarding, and legal pages.
- Auth handled via AWS Amplify (`src/lib/aws/amplify.ts`, `src/components/providers/AmplifyConfigProvider.tsx`).
- State management via Redux Toolkit (`src/redux`), with RTK Query services split by domain (`auth`, `onboarding`).
- UI built with MUI + Tailwind CSS; landing page components live in `src/components/landingPage`.
- Shared UI primitives live in `src/components/common`: `Logo` (text-based brand mark), `Button` (generic form/CTA button), `GetStartedButton` (the specific "Get Started" CTA style, reused wherever that button appears except Pricing's plan buttons).
- Brand font "Fjalla One" is loaded via `next/font/google` in `src/app/layout.tsx` and exposed as the `.fjalla-one-regular` utility class in `globals.css`.
- The Navbar (`src/components/landingPage/Navbar.tsx`) has no logo — it was intentionally removed; only the Menu/Get Started controls remain.
- `AnnouncementBanner.tsx` still exists but is not rendered anywhere (removed from `src/app/page.tsx`).

## Site-wide animated background (as of 2026-08-09)
`src/components/common/KineticGrid.tsx` — a canvas animation (grid that warps toward the cursor, ripples on click) using the site's gold palette (`--gold-primary` lines/nodes, `--gold-light` ripples) on a matte black (`#000000`) canvas fill. Replaced the old `AnimatedXBackground.tsx` (floating X-shapes, now deleted, along with its dead CSS in `globals.css`).

**Mounted exactly once**, in `src/app/layout.tsx` inside `<body>`, as `position: fixed; z-index: -10`. **Never add `<KineticGrid />` to an individual page** — it's global by design; adding it again per-page would stack multiple animated canvases (each with its own rAF loop + window listeners).

For it to be visible, **no page's own root wrapper may have an opaque background** (`bg-black` etc. was stripped from every page's outer container app-wide — kept `min-h-screen`/`flex`/`relative`/etc., just not the background color; `<body>`'s own `bg-black` is fine to keep, it's a harmless pre-hydration fallback since it's `KineticGrid`'s *parent*, not a later opaque sibling). This isn't optional styling — a negative-`z-index` fixed layer is hidden by **any** `z-index: auto` opaque background anywhere later in the DOM, no matter how deeply nested; it's a document-wide stacking rule, not a parent/child one. This bit twice already (landing-page sections, then every other page's wrapper `div`) before the actual rule was understood — see the memory system for the full writeup, don't re-derive it from scratch.

If a new page is added: don't give its root container a background color, don't import `KineticGrid`. It inherits the global one automatically. A section-local opaque background (e.g. a card) is fine and expected to occlude the animation in that specific spot.

## Onboarding + signup flow (as of 2026-08-09)
Full flow: **Get Started → `/onboarding` (4 questions, anonymous) → `/auth/signup` (form) → live progress screen → `/dashboard`.**

- All "Get Started" buttons (Navbar desktop/mobile, WhyTexalya) route straight to `/onboarding`, treating the visitor as anonymous/new — `/onboarding` never redirects unauthenticated users to `/auth/login`, and never skips to `/dashboard` for already-onboarded users.
- Onboarding is a single linear 4-step flow: business type → biggest challenge → team size → optional website URL. Each `StepOption` has a `value` (the machine slug actually sent to the API) separate from its `label` (display text) — **`QuestionStep.tsx` must call `onSelect(opt.value)` / `isSelected(opt.value)`, never `opt.label`**; this exact bug (passing the label as the answer) broke every onboarding field's validation for a while and is easy to reintroduce if these components are touched carelessly.
- The old **per-question** `submitOnboardingAnswer` API (`src/redux/services/onboarding/onboarding.ts`) is unused dead code now — do not resurrect it. It's superseded by the combined API below.
- Step 4 (website): the **Finish/Next button requires a non-empty value like any other step** (`canProceed()` no longer special-cases it to always return true) — only the explicit **"Skip — I'll add it later"** link bypasses that and calls `handleNext("")` directly. Don't reintroduce "always allow proceeding" for this step.
- On finishing, the 4 answers are written to `sessionStorage` under `ONBOARDING_ANSWERS_STORAGE_KEY` (`src/constants/onboarding.ts`) as `{ businessType, challenge, teamSize, websiteUrl }`, then the user is routed straight to `/auth/signup` — no loading screen in between anymore (that only happens after signup now).
- A dedicated Login button (routing to `/auth/login`) is still planned but not yet added.

### Combined signup+onboarding API (`src/lib/api/signupStream.ts`)
One endpoint now does account creation, Cognito confirmation, sign-in, saving onboarding answers, project creation, and (if a website URL was given) website fetch/analysis — all in one call, replacing the old separate Amplify `signUp` + onboarding-questionnaire flow.

- `POST https://q1qhgitk2a.execute-api.us-east-1.amazonaws.com/dev/xlya-dev-users-signup-api`
- Body: `{ firstName, lastName, gender, email, password, businessType?, challenge?, teamSize?, websiteUrl? }`. Onboarding fields come from `sessionStorage` (see above), read once at submit time in `src/app/(pages)/auth/signup/page.tsx`.
- **`gender` values**: `male` / `female` / `prefer_not_to_say` (mapped from the form's display strings via `GENDER_SLUGS`).
- **Enum values confirmed from real 400 responses — do not re-guess these**:
  - `businessType`: `ecommerce`, `saas`, `agency`, `creator`, `local`, `other`
  - `challenge`: `content`, `leads`, `ops`, `scale` (NOT `manual_work`/`scaling` — that was a wrong first guess that broke validation)
  - `teamSize`: `solo`, `small`, `medium` (NOT `small_team`/`large_team`)
- **Response is NDJSON, not SSE** — `Content-Type: application/x-ndjson`, `Transfer-Encoding: chunked`, one bare `{...}` JSON object per line (`\n`-separated), **no `data:` prefix, no blank-line event separators**. This was gotten wrong once (assumed SSE framing) which silently dropped 100% of events including the final result — confirmed the real format by curling the endpoint directly rather than guessing again.
- Two event shapes on the `type` field:
  - `"step"`: `{ type, step, parent, status: "started"|"completed"|"failed", label, data?, error? }`. `parent: null` = top-level step (known IDs in `signup/page.tsx`'s `BASE_STEP_IDS` / `WEBSITE_STEP_IDS`); non-null = a nested sub-step, shown only via the live "activity" text, not its own row. `status: "failed"` on a step (e.g. `generate_icp_competitors` hitting an LLM rate limit) does **not** mean the whole signup failed — the backend keeps going; only the final `result` event's `statusCode` is authoritative.
  - `"result"` (always last): success has `statusCode: 200`, `message`, `tokens: { accessToken, idToken, refreshToken }`, `sub`, `project`. Failure has `statusCode` (409 duplicate email, 400 validation, etc.) and `error` instead of `message`, optionally `details: string[]` (validation errors — prefer this over the generic `error` string when present).
- **The backend cannot truly stream to the browser through this API Gateway route** — confirmed by curl timing; the whole NDJSON body arrives in one burst regardless of how incrementally the Lambda wrote it. `signupStream.ts` parses/delivers events as fast as they arrive (no artificial delay); the *visual* pacing (paced single-step reveal, ~7s target) lives entirely in `signup/page.tsx` / `LoadingScreen.tsx`, decoupled from real network timing. Don't move pacing back into the transport layer.
- `signupStream.ts` has a 35s inactivity timeout (`AbortController`) — a stalled connection surfaces as a normal catchable error instead of hanging the UI forever.

### Token storage
- Only the **access token** is persisted (Redux `AuthState.tokens = { accessToken, expiresAt }` + the same shape in `localStorage`'s `UserData`) — id/refresh tokens are never stored, since nothing in the app actually uses them (auth headers use `cognito_sub`, not a Bearer token — see `baseApi.ts`).
- `expiresAt` is the token's real JWT `exp` claim in ms-epoch, not a hardcoded "24h" assumption — decoded via `src/utils/jwt.ts#getJwtExpiryMs` for the raw JWT from the signup stream, or read off Amplify's already-parsed `payload.exp` for the login/session-refresh (Amplify) paths.
- `ProtectedRoute` checks `tokens.expiresAt` on every run and force-logs-out + redirects to `/auth/login` if it's in the past, in addition to the existing "never authenticated" redirect.
- `AuthState.user.projectId` is populated from the signup response's `project.project_id` and persisted the same way as other user fields.

## Project list/detail + dashboard live activity (as of 2026-08-29)
`xlya-dev-users-project-list-detail-lambda` (`POST /dev/xlya-dev-users-project-list-detail-api`, same account/region as the other lambdas) lists every project a `sub` owns and fetches one project's full row from `xlya-dev-projects-table`. Same NDJSON step/result streaming pattern as the rest (`awslambda.streamifyResponse`, `Authorization: Bearer <accessToken>` resolved to `sub` via a plain Cognito `GetUserCommand`).

- `action: "list"` → lightweight summaries (`project_id, project_name, website_url, isDefault, project_onboarding_status, created_at, updated_at`), no icp/competitors/lighthouse (kept cheap for the switcher dropdown).
- `action: "get"` (needs `project_id`) → the full row, scoped server-side to the caller's own `sub` (404 if the id doesn't belong to them).
- Frontend client: `src/lib/api/projectListStream.ts`.

`AppNavbar.tsx`'s "Select Project" dropdown is wired to this for real (previously a single dummy option): on mount it lists all projects, picks the currently-selected one (or the `isDefault`/first) and loads its full detail; clicking a different project in the dropdown re-fetches and dispatches `setProject`, which is the single Redux field every other project-scoped lambda call (`projectContentStream`, `MarketAnalysis`) already reads `project_id`/data from — so switching in the navbar is what actually changes "the current project" app-wide. `AuthState` gained `projects: ProjectSummary[]` and `projectActivity: ProjectActivityLine | null` (both ephemeral, not persisted to localStorage — refetched every navbar mount for freshness).

Every streamed step from these calls feeds `state.auth.projectActivity`, rendered as a "Live Activity" `MiniTerminal` card on `/dashboard` (`src/app/(pages)/dashboard/page.tsx`) — reuses the existing single-line `MiniTerminal` component rather than a new multi-line log panel, per the established convention (one line, most-recent-step-wins).

`MarketAnalysis.tsx` (`src/components/dashboard/MarketAnalysis.tsx`) now renders all three fields the task requires: lighthouse scores (pre-existing), plus ICP (target audience callout, demographics chips, pain points/motivations/buying triggers) and Competitors (icon+name+reason rows, with any competitor whose name matches the project's own `project_name` filtered out) — both were missing from the file despite an earlier session's memory describing a richer version that no longer exists in the codebase.

## Create new project (as of 2026-08-29)
`xlya-dev-users-create-project-lambda` (`POST /dev/xlya-dev-users-create-project-api`) lets an already-signed-up account create an **additional** project from just a website URL — the project name is derived from the domain (`https://www.notion.com` → `notion`), no separate name field. It reuses the signup lambda's website-crawl/parse/lighthouse/NVIDIA-ICP logic (fetches up to 5 pages: homepage + up to 4 more same-domain pages) and the project-setting lambda's S3+Bedrock KB sync logic, then flips the account's previous default project to `isDefault:false` and marks the new one `isDefault:true`. The knowledge-base document it writes is a **distilled, on-topic business profile** generated by a second NVIDIA call scoped to growth/marketing/business/freelance content — not a raw dump of scraped page text. Frontend client: `src/lib/api/createProjectStream.ts`. See `.claude/lambda-logic.md`, `.claude/knowledge-base-sync.md`, and `.claude/aws-resources.md` for the full reusable conventions and resource inventory this was built against.

## Agents screen (as of 2026-08-30)
`/dashboard/agents` — a Claude-web-style two-pane screen for chat-based agents, reached via a new "Agents" link in `AppNavbar.tsx`'s `appLinks`. Unlike the rest of the app it does **not** use the shared top-pill nav pattern for its own layout: `src/components/agents/AgentsSidebar.tsx` is a permanent left-hand vertical rail (agent picker + "New chat" + job history), and the page itself (`src/app/(pages)/dashboard/agents/page.tsx`) is a fixed-height (`h-screen`, no page scroll) flex layout with the sidebar and a chat panel as two independently-scrolling opaque cards — both fine per the KineticGrid stacking rule since only the page's own root wrapper must stay non-opaque, not child cards.

- Talks to `xlya-dev-users-vibe-prospecting-lambda` (the chat/agent Lambda from `project_vibe_prospecting_agent_lambda_2026_08_30`, previously backend-only) via a new client, `src/lib/api/vibeProspectingAgentStream.ts` — this Lambda is a **Function URL** (`https://5b225ofw4osgzulhiagjj2zdjm0kmlmz.lambda-url.us-east-1.on.aws/`, `RESPONSE_STREAM`/`AuthType: NONE`), not an API Gateway route like every other `*Stream.ts` client, though the wire format (NDJSON, `Authorization: Bearer <accessToken>`) is identical. It adds one extra event shape beyond step/result: `{type:"message", role:"assistant", text}` — the frontend deliberately ignores these and renders chat bubbles from the `result` event's `reply`/`download_url` fields only, since the lambda sends the same text both ways except on cancel/export (rendering both would double the bubble).
- `AGENTS` is a one-entry array today (`vibe_prospecting`) in `page.tsx`, structured so a second agent is just another array entry + its own `*Stream.ts` client — no layout changes needed.
- Only one active agent-lambda call fires at a time from the UI (`welcome` on project change, `chat`/`run_template` on send, `get_job` on selecting sidebar history, `list_jobs` to refresh the sidebar) — no persistent chat state in Redux; it's local `useState` in `page.tsx`, same pattern as `McpConnectorSidebar`.
- Clicking a template chip on the empty-state screen calls `run_template` directly (all 5 backend stages run in one call, no per-stage confirmation) rather than inserting the template text into the input box — that matches what `run_template` was actually built for. Free-typed messages instead go through `chat`, which pauses for confirm/refine/cancel after each stage per the backend's design.
- Loading a past conversation via `get_job` only returns `s3_key`, not a fresh presigned `download_url` (those expire after 1h and aren't regenerated by that action) — the UI shows a text note that the export link expired instead of a dead download button.
- `src/components/agents/DownloadButtons.tsx` is a CSV/XLSX split pill, greyed out (not hidden) until a `download_url` exists. CSV links straight to the lambda's presigned S3 URL; XLSX goes through `src/app/api/agents/export-xlsx/route.ts`, a same-origin Next.js Node route that fetches the CSV **server-side** and converts it with `exceljs` (new dependency), because `xlya-dev-s3` has no CORS configuration and a browser `fetch()` of the presigned URL would be blocked. The route allowlists the `url` query param's hostname (`xlya-dev-s3.s3*.amazonaws.com`) to avoid becoming an open proxy.
- **Vibe Prospecting is single-use per project, enforced entirely on the frontend** (the backend's `AGENT_TABLE` schema still technically allows multiple jobs per `project_id`): once `list_jobs` returns any job at all, `page.tsx` auto-loads it instead of showing the welcome screen, and disables "New chat" + the template chips (`AgentsSidebar`'s `newChatDisabled`/`agentsInUse` props show a gold "In use" badge too). Once that job's own status leaves `"active"` (an export was delivered), the chat input itself locks as well — starting a different search requires switching projects.

`AppNavbar.tsx`'s Project dropdown has a **"Create New Project"** item opening a single-field (website URL only) modal. Submitting closes the modal immediately — progress streams into the same `state.auth.projectActivity` the dashboard's Live Activity terminal already renders (every step, however minor, becomes a line), and a single toast fires only once the whole thing resolves (success or failure). On success, `state.auth.project` is set to the new project and the navbar's project list is refreshed.

**Portal gotcha**: both of AppNavbar's modals (create-project and delete-project) are rendered via `createPortal(..., document.body)`, not inline in the component tree. `<motion.nav>`'s framer-motion `animate` prop leaves a `transform` on the nav even at rest, which makes any `position: fixed` descendant behave like `absolute` relative to that transformed ancestor instead of the real viewport — the popup rendered off-center with an incomplete backdrop blur before this fix. Any new full-screen modal added inside `AppNavbar` (or any other framer-motion-animated ancestor) needs the same portal treatment.

## Landing page redesign (as of 2026-09-05)
`src/app/page.tsx` and `src/components/landingPage/` were rebuilt from a Figma Make export (`Xlya Landing Page.make` / `Xlya.fig` at repo root) — visual redesign only, all real routing/functionality preserved. This is a deliberate, isolated exception to several site-wide conventions:

- **KineticGrid is intentionally hidden on the landing page only.** The new design's sections use opaque per-theme backgrounds (`LandingThemeProvider`'s wrapping div plus each section's own background), which occludes the global animated grid per the existing stacking rule — done on purpose here (user-confirmed), not a bug. Every other page still shows the grid as before; nothing changed in `layout.tsx`'s mount of `KineticGrid`.
- **The landing page has its own light/dark theme toggle** (`src/components/landingPage/landingTheme.tsx` — `LandingThemeProvider`, `useLandingTheme`, `LandingThemeToggle`), scoped entirely to the landing page's component tree. No other page in the app has a theme toggle; this remains dark-only everywhere else.
- **New font pair for landing copy**: Fraunces (serif display) + DM Sans (body), added in `layout.tsx` via `next/font/google` and exposed as `--font-display`/`--font-body` in `globals.css`. The `XLYA` logo mark itself was deliberately left untouched — it still renders via the existing `Logo` component in Fjalla One (gold X / white LYA); in light theme it's wrapped in a small dark pill (`background:#0a0a0a`) purely so it stays legible against the light background, `Logo.tsx` itself was not modified.
- **Pricing and Contact sections were dropped** from the landing page (the Figma file doesn't include them). `Pricing.tsx`, `Contact.tsx`, and the now-unreferenced `WhyTexalya.tsx` still exist as dead files (same pattern as other superseded code in this repo, e.g. the old onboarding API) — not deleted, just unused. `src/app/api/contact/route.ts` (Resend email) is consequently also unused but left in place.
- **`Navbar` kept a `showNavLinks?: boolean` prop** for backward compatibility with `privacy-policy`/`terms-of-service`, which still pass `showNavLinks={false}` — the redesigned nav has no separate collapsible menu to gate, so the prop is currently a no-op accepted only to satisfy those callers' existing call sites.
- New section components: `Navbar`, `Hero`, `StrategySection`, `GrowthSection`, `MarketingSection`, `OperationsSection`, `Testimonials`, `FinalCTA`, `Footer`, plus shared `SectionLabel.tsx` and `useInView.ts`. Responsive behavior (nav links collapse under 640px, 2-col/3-col grids collapse on smaller viewports) lives in `src/components/landingPage/landing.css`, imported once by `page.tsx`.
- All real navigation was preserved/re-pointed to actual routes: "Get started free"/"Sign up free"/"Start for free" → `/onboarding`, "Sign in"/"Login" → `/auth/login`, footer Privacy/Terms → `/privacy-policy`/`/terms-of-service`.

## Auth pages
- The "Coming Soon" full-screen overlay has been removed from both `src/app/(pages)/auth/signup/page.tsx` and `src/app/(pages)/auth/login/page.tsx` — the real forms are live. (`AnnouncementBanner.tsx`'s unrelated "Coming Soon" marquee text was left as-is since it isn't rendered anywhere.)
- Signup form has a `Gender` field (Male / Female / Prefer not to say) — implemented as a **custom** dropdown (trigger button + absolutely-positioned dark panel), not a native `<select>`, because native option lists can't be themed.
- Signup no longer uses Amplify's `signUp` mutation directly (`authApi.signUp` in `auth.ts` is unused dead code now, kept for reference) — it calls the combined `streamSignup()` API above instead. Success routes to a live progress screen, then `/dashboard` — **not** `/auth/verify-email`, which is no longer part of this flow.
- Duplicate-email (409) shows a toast with a "Log in instead" link to `/auth/login`, not just a field-level error.
- Scrollbars are hidden globally (`src/app/globals.css`) — `scrollbar-width: none`, `::-webkit-scrollbar { display: none }` — on every page, scrolling still works.
