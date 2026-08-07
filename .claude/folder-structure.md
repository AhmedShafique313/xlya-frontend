# Xlya Frontend — Folder Structure

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
    │   │   └── ProtectedRoute.tsx
    │   ├── common/
    │   │   ├── AnimatedXBackground.tsx
    │   │   ├── Button.tsx           # shared form/CTA button (variant: primary | outline | ghost)
    │   │   ├── GetStartedButton.tsx # dedicated "Get Started" button matching Navbar's settings
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
    │   │   ├── LoadingScreen.tsx
    │   │   ├── OptionCard.tsx
    │   │   ├── ProgressBar.tsx
    │   │   ├── QuestionStep.tsx
    │   │   └── WelcomeScreen.tsx
    │   ├── providers/
    │   │   └── AmplifyConfigProvider.tsx
    │   └── snakbar/
    │       ├── ToastProvider.tsx
    │       └── index.ts
    ├── constants/
    │   └── colors.ts
    ├── lib/
    │   └── aws/
    │       └── amplify.ts
    ├── redux/
    │   ├── hooks.ts
    │   ├── provider.tsx
    │   ├── services/
    │   │   ├── auth/
    │   │   │   ├── auth.ts
    │   │   │   └── profileInfo.ts
    │   │   ├── baseApi.ts
    │   │   └── onboarding/
    │   │       └── onboarding.ts
    │   └── store.ts
    └── utils/
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
