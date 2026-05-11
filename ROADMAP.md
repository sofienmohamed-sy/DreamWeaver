# ROADMAP.md — DreamWeaver build plan

Status legend: `[ ]` pending · `[~]` in progress · `[x]` done

Working branch: `claude/build-dreamweaver-app-BhxY1`

Each phase commits as multiple focused commits, not one giant blob. After the phase's DoD is hit, push to the working branch.

---

## Phase 0 — Foundation `[~]`

Goal: empty but well-organized monorepo ready for everything that follows.

- [x] pnpm workspace (`pnpm-workspace.yaml`, root `package.json`)
- [x] Root TS config (`tsconfig.base.json` — strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`)
- [x] Tooling files (`.gitignore`, `.editorconfig`)
- [x] Firebase project config (`firebase.json`, `.firebaserc` placeholder)
- [x] Default-deny `firestore.rules` and `storage.rules`
- [x] Empty `firestore.indexes.json`
- [x] Documentation (`CLAUDE.md`, `SPEC.md`, `ARCHITECTURE.md`, `ROADMAP.md`)
- [ ] CI workflow (`.github/workflows/ci.yml` — lint + typecheck + test)

**Definition of done**: `pnpm install` works; `firebase deploy --only firestore:rules,storage` would succeed against a real project; CI workflow runs on PR.

---

## Phase 1 — Shared package `[ ]`

Goal: every data shape in DreamWeaver, defined once.

- [ ] `packages/shared/package.json` + `tsconfig.json`
- [ ] Zod schemas: `user`, `plan`, `quota`, `world`, `location`, `character`, `plotThread`, `session`, `message`, `worldEvent`, `worldGenOutput`
- [ ] Inferred TS types exported via `z.infer<typeof Schema>`
- [ ] Constants: rate limits, model IDs, prompt versions, default world params
- [ ] Prompt strings: `worldGen`, `session`, `tickWorld`, `memoryExtract` (versioned)
- [ ] Vitest tests for schema parsing (positive + negative cases)

**Definition of done**: `pnpm --filter @dreamweaver/shared test` green. Zero `any` in the package.

---

## Phase 2 — Web skeleton `[ ]`

Goal: a user can sign up, sign in, and reach a dashboard. Nothing more.

- [ ] Vite + React 18 + TS strict app in `apps/web`
- [ ] Tailwind + Radix UI + Lucide React wired up
- [ ] Firebase client SDK config via env vars (`.env.example` checked in)
- [ ] Auth: Email + password, Google OAuth, password reset, email verification
- [ ] `<AuthGuard>` route wrapper
- [ ] Zustand auth store
- [ ] TanStack Query provider
- [ ] React Hook Form + Zod resolvers
- [ ] Routes: `/`, `/signin`, `/signup`, `/forgot`, `/dashboard`, `/world/new`, `/world/:id`, `/world/:id/session/:sid`
- [ ] Empty dashboard placeholder with sign-out

**Definition of done**: signup → email verify → land on empty dashboard.

---

## Phase 3 — Firestore + rules `[ ]`

Goal: lock down the database before any data lives in it.

- [ ] Full `firestore.rules` with explicit per-collection allowances
- [ ] `storage.rules` for portrait paths (owner read; Functions-only write)
- [ ] Composite indexes in `firestore.indexes.json`
- [ ] Rules unit tests with `@firebase/rules-unit-testing`
  - [ ] Unauthorized denies on all paths
  - [ ] Owner reads pass
  - [ ] Cross-user reads deny
  - [ ] Client cannot write `plan` or `stripeCustomerId`
  - [ ] Client cannot write `quotas/**`

**Definition of done**: rules unit tests green; manual review of every rule.

---

## Phase 4 — Functions skeleton `[ ]`

Goal: foundation for all server code.

- [ ] `apps/functions/package.json` + TS strict `tsconfig.json`
- [ ] Anthropic + Gemini SDKs wired with `firebase functions:secrets:get`
- [ ] `requireAuth(context)` helper
- [ ] `incrementQuota(uid, kind, amount)` transactional helper
- [ ] Error taxonomy module (typed `HttpsError` wrappers)
- [ ] `logClaudeCall(input, output)` token-counter wrapper
- [ ] Hello-world `ping` callable for emulator smoke test

**Definition of done**: `firebase emulators:start` runs functions; `requireAuth` rejects unauthenticated calls; quota helper passes a unit test.

---

## Phase 5 — World creation `[ ]`

Goal: 3 sentences → full persistent world.

- [ ] `WorldGenSchema` strict Zod (in shared package)
- [ ] World-gen prompt with `cache_control`
- [ ] `createWorld` callable function
- [ ] `generatePortrait` Cloud Tasks task function
- [ ] Web UI: 3-sentence form → loading state → world view
- [ ] Portrait status indicator (pending/ready/error)

**Definition of done**: form submit → ready world with portraits in <60s; both quota counters incremented; rules tests still pass.

---

## Phase 6 — Session UX (web) `[ ]`

Goal: streaming chat with character memory.

- [ ] Chat layout (Radix + Tailwind), responsive
- [ ] `sendMessage` HTTPS streaming function (SSE)
- [ ] Client fetch + ReadableStream consumption
- [ ] Optimistic user message rendering
- [ ] Memory-extraction post-stream
- [ ] Rolling memory summary update every N memories

**Definition of done**: first token <500ms after submit; character remembers user-mentioned facts across sessions.

---

## Phase 7 — Offline evolution `[ ]`

Goal: world lives even when the user is gone.

- [ ] `tickWorld` scheduled function (6h cadence)
- [ ] Character autonomous-action prompt
- [ ] `worldEvents` write logic
- [ ] "While you were away" feed UI
- [ ] Character aging on world-time advance

**Definition of done**: leave a world for 6h (or trigger scheduler manually) → events appear; characters reference autonomous actions in next chat.

---

## Phase 8 — Paywall `[ ]`

Goal: monetization without dark patterns.

- [ ] Stripe Checkout session creation callable
- [ ] `stripeWebhook` HTTPS function (signature verified)
- [ ] Plan flip on `checkout.session.completed`
- [ ] Plan revert on `customer.subscription.deleted`
- [ ] Upgrade modal triggered on `resource-exhausted` errors
- [ ] Plan badge in UI

**Definition of done**: free user hits 50 msg/month → blocked + modal; paid user → unlocked up to 2000.

---

## Phase 9 — Mobile `[ ]`

Goal: feature parity for sessions and browsing.

- [ ] Expo + React Native scaffold in `apps/mobile`
- [ ] Shared Firebase config + `packages/shared` import
- [ ] Auth (Email + Google) — uses Firebase Auth same as web
- [ ] World browsing + session chat parity
- [ ] No world creation in v1 (web only)
- [ ] No native IAP in v1 (web upgrade only)

**Definition of done**: iOS sim + Android emulator: sign in, open existing world, send a message.

---

## Phase 10 — Test & harden `[ ]`

Goal: production-ready.

- [ ] Vitest coverage report
- [ ] Playwright E2E: signup → create world → session → paywall trigger
- [ ] Manual security audit using the checklist in `CLAUDE.md`
- [ ] Deploy runbook appended to `CLAUDE.md`
- [ ] Cost smoke test: 10 messages, verify cache hit rate >80%

**Definition of done**: E2E green; security checklist signed off; cost projection validated against real telemetry.
