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
    │       ├── Logo4.png
    │       ├── logo.png
    │       ├── logo2.jpg
    │       └── logo3.jpg
    ├── components/
    │   ├── auth/
    │   │   ├── AuthFeaturesSidebar.tsx
    │   │   └── ProtectedRoute.tsx
    │   ├── common/
    │   │   └── AnimatedXBackground.tsx
    │   ├── landingPage/
    │   │   ├── AnnouncementBanner.tsx
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
