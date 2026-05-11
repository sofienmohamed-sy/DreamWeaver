# CLAUDE.md — Operating manual for DreamWeaver

This file is loaded into context at the start of every Claude Code session in this repo. Read it before making changes.

## What DreamWeaver is

Personal AI World web app with iOS/Android mobile companion. Users write a 3-sentence story idea → AI generates a persistent world (locations, characters, plot threads) → users enter it as an infinite text-based RPG. Characters remember across sessions, age, and pursue goals autonomously even while the user is offline (advanced via scheduled Cloud Functions).

Solo developer, zero budget, Firebase-only backend.

## Tech stack (locked — do not swap without discussion)

| Layer | Tool |
|---|---|
| Web | Vite + React 18 + TypeScript (strict) + TailwindCSS + Radix UI + Lucide React |
| Mobile | Expo + React Native (TS strict), same Firebase backend |
| State (client) | Zustand |
| Server cache | TanStack Query |
| Forms | React Hook Form + Zod resolvers |
| Backend | Firebase Functions v2 (Node 20, TS strict) |
| DB | Firestore |
| Auth | Firebase Auth (Email + Google OAuth) |
| Storage | Firebase Storage |
| AI text | Anthropic Claude — `claude-sonnet-4-6` with prompt caching |
| AI images | Google Gemini |
| Monorepo | pnpm workspaces |
| Testing | Vitest (unit) + Playwright (E2E) |
| Payments | Stripe Checkout |

## Coding philosophy — read this before writing a single line

The developer building this is **transitioning from vibecoding to real engineering**. Code must teach. Concretely:

1. **Comment the WHY, not the WHAT.** Well-named code already says what it does. Comments explain non-obvious decisions: hidden constraints, subtle invariants, workarounds, surprising behavior.

2. **`// LEARN:` markers.** Whenever code demonstrates an engineering pattern, security practice, or non-obvious correctness concern the developer should internalize, prefix the explanation with `// LEARN:`. Examples:
   - `// LEARN: We use a Firestore transaction here because two concurrent reads could otherwise both pass the quota check before either writes.`
   - `// LEARN: 'unknown' forces a type narrow before use; 'any' silently allows bugs through. We never use 'any' in this codebase.`

3. **No `any`. Ever.** Use `unknown` and narrow. Use Zod-inferred types. Enforced via `@typescript-eslint/no-explicit-any: error`.

4. **Types flow from Zod.** Every shared shape is a Zod schema in `packages/shared/src/schemas/`. TS types are inferred via `z.infer<typeof Schema>`. Never declare a shape twice — runtime validation and compile-time types must come from the same source.

5. **No premature abstraction.** Three similar lines beat a generic helper. Build the helper when there's a fourth use case, not before.

6. **No dead code.** No commented-out blocks. No `_unused` variables. No "for future use" exports. If it's not used now, delete it.

7. **Functions check auth on line one.** `requireAuth(context)` before anything else. No exceptions.

## Security non-negotiables

| Rule | Enforcement |
|---|---|
| Default-deny Firestore rules | `firestore.rules` denies all by default; every collection is explicitly allowed |
| Every Function checks auth | `requireAuth(context)` is the first line of every callable / HTTPS handler |
| Clients can NEVER write `plan`, `stripeCustomerId`, or any `quotas/**` doc | Rules deny those writes; Functions own those mutations via Admin SDK |
| Quota checks are transactional | Read-then-write inside `db.runTransaction()` — prevents race conditions |
| API keys server-only | Anthropic + Gemini + Stripe secret keys live in Functions secrets; never shipped to client |
| Stripe webhook signature verified | `stripe.webhooks.constructEvent` with the signing secret — never trust webhook payloads |

If you're about to write code that violates any of these, stop and re-read.

## Repo layout

```
apps/web         — Vite + React web app
apps/mobile      — Expo + React Native mobile app
apps/functions   — Firebase Functions (Node 20)
packages/shared  — Zod schemas, inferred types, constants, prompt strings
```

Plus root-level Firebase + tooling config.

## Commands

Phase 0 stubs (more added per phase):

```bash
pnpm install                # install all workspaces
pnpm typecheck              # tsc across all packages
pnpm lint                   # ESLint across all packages
pnpm test                   # Vitest across all packages
pnpm emulators              # firebase emulators (auth, firestore, functions, storage)
pnpm deploy:rules           # deploy firestore + storage rules
pnpm deploy:functions       # deploy Cloud Functions
pnpm deploy:hosting         # deploy web app
```

## Secrets — three stores, one rule each

Three different stores hold three different categories of secret. Mixing them is the most common security mistake. The rule for each:

| Store | What goes here | What does NOT |
|---|---|---|
| **Google Cloud Secret Manager** (`firebase functions:secrets:set`) | All server-side API keys: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SIGNING_SECRET` | Client-side config; any value the browser/app will see |
| **Local `.env.local` files** (gitignored) | Per-developer config: Firebase web config, Stripe publishable key, emulator toggles | Anything you wouldn't put in a screenshot of your code |
| **GitHub Actions secrets** (Repo Settings → Secrets and variables → Actions) | `FIREBASE_SERVICE_ACCOUNT_JSON` for CI deploys (added in Phase 10) | Anthropic/Gemini/Stripe keys — those go in Cloud Secret Manager, NEVER here |

Full reference: see `.env.example` at the repo root.

### Setting up secrets locally (one-time)

```bash
# Firebase web config → copy from Firebase Console into apps/web/.env.local
# (Phase 2 will scaffold the file; until then, just keep the values handy.)

# Server-side keys → Cloud Secret Manager (used by Functions at runtime)
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SIGNING_SECRET

# For LOCAL emulator dev that needs the same keys, create
# apps/functions/.secret.local (gitignored) with KEY=value lines.
```

### GitHub Actions secrets

Today the CI workflow only runs typecheck + lint + unit tests — **no GitHub secrets are required**. Add `FIREBASE_SERVICE_ACCOUNT_JSON` only when Phase 10 adds the deploy job. To generate that secret: Firebase Console → Project Settings → Service accounts → "Generate new private key" → paste the entire JSON into the GitHub secret.

## Pre-deploy security checklist

Before any production deploy:

- [ ] Firestore rules reviewed; no `allow ... if true` outside owner paths
- [ ] Storage rules reviewed; portraits write-only-by-Functions
- [ ] No secrets in committed files (`.env*` and `serviceAccount*.json` are ignored; rotate if leaked)
- [ ] Every Function calls `requireAuth(context)`
- [ ] Quota helpers use transactions, not separate get + set
- [ ] Stripe webhook verifies signature before processing
- [ ] Anthropic + Gemini keys set via `firebase functions:secrets:set`
- [ ] CI passes (typecheck, lint, tests)
- [ ] Rules unit tests pass

## Roadmap

See `ROADMAP.md` for the phase-by-phase build plan. Current phase status is tracked there.

## When in doubt

Ask. The cost of a clarification is low; the cost of building the wrong abstraction is high.
