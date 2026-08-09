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

## Auth pages
- The "Coming Soon" full-screen overlay has been removed from both `src/app/(pages)/auth/signup/page.tsx` and `src/app/(pages)/auth/login/page.tsx` — the real forms are live. (`AnnouncementBanner.tsx`'s unrelated "Coming Soon" marquee text was left as-is since it isn't rendered anywhere.)
- Signup form has a `Gender` field (Male / Female / Prefer not to say) — implemented as a **custom** dropdown (trigger button + absolutely-positioned dark panel), not a native `<select>`, because native option lists can't be themed.
- Signup no longer uses Amplify's `signUp` mutation directly (`authApi.signUp` in `auth.ts` is unused dead code now, kept for reference) — it calls the combined `streamSignup()` API above instead. Success routes to a live progress screen, then `/dashboard` — **not** `/auth/verify-email`, which is no longer part of this flow.
- Duplicate-email (409) shows a toast with a "Log in instead" link to `/auth/login`, not just a field-level error.
- Scrollbars are hidden globally (`src/app/globals.css`) — `scrollbar-width: none`, `::-webkit-scrollbar { display: none }` — on every page, scrolling still works.
