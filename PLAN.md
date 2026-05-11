# DreamWeaver — Full Implementation Plan

## Project Overview

DreamWeaver is a Personal AI World web application (+ iOS/Android) where users write a
3-sentence story idea and receive a complete persistent narrative world: locations,
characters with personalities and goals, and plot threads. Users enter the world as an
infinite text-based RPG. Characters remember users across sessions, age over time, and
pursue their own objectives. The world evolves autonomously via scheduled background jobs.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web frontend | Vite + React 18 + TypeScript (strict) + TailwindCSS + Radix UI + Lucide React |
| Mobile | Expo + React Native (shared Firebase backend + types) |
| State | Zustand (client) + TanStack Query (server cache) |
| Forms | React Hook Form + Zod |
| Backend | Firebase Functions (Node 20, TypeScript) |
| Database | Firestore |
| Auth | Firebase Auth (email + Google OAuth) |
| Storage | Firebase Storage |
| AI text | Anthropic Claude Sonnet 4.6 (aggressive prompt caching) |
| AI images | Google Gemini |
| Monorepo | pnpm workspaces |
| Testing | Vitest (unit) + Playwright (E2E) |

---

## Monorepo Structure

```
DreamWeaver/
├── apps/
│   ├── web/                  # Vite + React 18 web app
│   ├── mobile/               # Expo + React Native app
│   └── functions/            # Firebase Cloud Functions (Node 20)
├── packages/
│   └── shared/               # Shared TypeScript types + Zod schemas
├── firebase/
│   ├── firestore.rules       # Firestore security rules
│   ├── storage.rules         # Firebase Storage rules
│   └── firestore.indexes.json
├── CLAUDE.md
├── SPEC.md
├── ARCHITECTURE.md
├── ROADMAP.md
├── pnpm-workspace.yaml
├── package.json              # Root (scripts + devDeps)
└── tsconfig.base.json        # Shared TS config
```

---

## Phase 0 — Foundation (Docs + Monorepo Scaffold)

### Files to create

**Documentation**
- `CLAUDE.md` — Dev conventions, all pnpm/firebase commands, LEARN: markers
- `SPEC.md` — Full feature spec, data models, API contracts, quota rules
- `ARCHITECTURE.md` — System diagram, Firebase topology, AI pipeline, data flow
- `ROADMAP.md` — Phased milestones with status tracking

**Monorepo scaffold**
- `pnpm-workspace.yaml`
- Root `package.json` with workspace scripts
- `tsconfig.base.json` — strict TypeScript base config
- `apps/web/` — Vite + React scaffold with TailwindCSS + Radix UI
- `apps/functions/` — Firebase Functions scaffold (Node 20 + TypeScript)
- `apps/mobile/` — Expo scaffold (bare minimum)
- `packages/shared/` — Empty typed package with index.ts

**Firebase**
- `firebase.json` — Hosting + Functions + Firestore + Storage config
- `.firebaserc` — Project aliases
- `firebase/firestore.rules` — Deny-by-default rules skeleton
- `firebase/storage.rules` — Deny-by-default rules skeleton
- `.env.example` files for web and functions

**Checkpoint 1**: Review docs + scaffold before any feature code.

---

## Phase 1 — Shared Types + Firestore Schema

### `packages/shared/src/types.ts`
```
User         { uid, email, displayName, photoURL, createdAt, quota }
Quota        { worldCount, messageCount, resetAt, tier: 'free'|'pro' }
World        { id, ownerId, title, premise, status, createdAt, lastEvolvedAt, settings }
Location     { id, worldId, name, description, connectedTo[], imageURL? }
Character    { id, worldId, name, description, personality, goals[], currentLocation,
               age, memory[], lastSeenAt, portraitURL? }
PlotThread   { id, worldId, title, description, status, involvedCharacters[] }
Session      { id, worldId, userId, startedAt, lastActiveAt, characterFocus? }
Message      { id, sessionId, role: 'user'|'assistant', content, timestamp, tokenCount? }
EvolutionLog { id, worldId, timestamp, summary, changes[] }
```

### `packages/shared/src/schemas.ts`
- Zod schemas matching every type above
- Input schemas for Cloud Function calls (validated at boundary)

### Firestore collections layout
```
users/{uid}
users/{uid}/quota  (subcollection or field)
worlds/{worldId}
worlds/{worldId}/locations/{locationId}
worlds/{worldId}/characters/{characterId}
worlds/{worldId}/plotThreads/{threadId}
worlds/{worldId}/sessions/{sessionId}
worlds/{worldId}/sessions/{sessionId}/messages/{messageId}
worlds/{worldId}/evolutionLogs/{logId}
```

---

## Phase 2 — Auth (Web)

### Files
- `apps/web/src/lib/firebase.ts` — Firebase app init (typed)
- `apps/web/src/stores/authStore.ts` — Zustand store: user, loading, error
- `apps/web/src/components/auth/LoginForm.tsx` — RHF + Zod
- `apps/web/src/components/auth/RegisterForm.tsx`
- `apps/web/src/components/auth/PasswordResetForm.tsx`
- `apps/web/src/components/auth/GoogleOAuthButton.tsx`
- `apps/web/src/components/layout/ProtectedRoute.tsx`
- `apps/web/src/pages/LoginPage.tsx`
- `apps/web/src/pages/RegisterPage.tsx`
- `apps/web/src/pages/PasswordResetPage.tsx`
- `apps/web/src/App.tsx` — Router with protected routes

### Behaviour
- On login → redirect to `/dashboard`
- Unauthenticated → redirect to `/login`
- Auth state persisted via Firebase SDK (localStorage)
- Google OAuth popup flow

---

## Phase 3 — World Creation (Web + Functions)

### Web
- `apps/web/src/pages/NewWorldPage.tsx` — 3-sentence prompt form
- `apps/web/src/pages/DashboardPage.tsx` — Lists user's worlds
- `apps/web/src/components/world/WorldCard.tsx`
- `apps/web/src/components/world/WorldCreationForm.tsx`
- Free tier gate: if `quota.worldCount >= 1` → show upgrade prompt

### `createWorld` Cloud Function
**Input**: `{ premise: string }` (validated with Zod)  
**Steps**:
1. Auth check — reject if unauthenticated
2. Quota check — reject if `worldCount >= 1` on free tier
3. Call Claude Sonnet 4.6 with system prompt + premise
   - Uses prompt caching on system prompt (LEARN: cache_control blocks)
   - Returns JSON: `{ title, locations[], characters[], plotThreads[] }`
4. Call Gemini for each character portrait (parallel, max 5)
5. Upload portrait images to Firebase Storage
6. Write world + all sub-documents to Firestore in a batch
7. Increment `quota.worldCount`
8. Return `{ worldId }`

**Error handling**: transactional — if any step fails, clean up partial writes.

---

## Phase 4 — Session / Roleplay (Web + Functions)

### Web
- `apps/web/src/pages/WorldPage.tsx` — World overview + enter session button
- `apps/web/src/pages/SessionPage.tsx` — Chat UI with streaming
- `apps/web/src/components/session/MessageList.tsx`
- `apps/web/src/components/session/MessageInput.tsx`
- `apps/web/src/components/session/CharacterPanel.tsx` — Shows active characters
- `apps/web/src/stores/sessionStore.ts` — Zustand: messages, streaming state
- TanStack Query for session/message fetching

### `sendMessage` Cloud Function (streaming)
**Input**: `{ sessionId: string, worldId: string, content: string }`  
**Steps**:
1. Auth check
2. Quota check — reject if `messageCount >= 50` on free tier
3. Load world + relevant characters + last 20 messages from Firestore
4. Build Claude prompt with character context (LEARN: how to structure RPG system prompts)
   - System prompt cached (world lore is static per world)
   - Dynamic: recent messages + character states
5. Stream response back via Server-Sent Events
6. On completion: save assistant message to Firestore, update character memory, increment quota
7. Character memory update: summarise interaction → append to `character.memory[]`

### Rate limiting
- Firestore transaction on quota before each message
- If over limit → return 429 with `{ upgradeRequired: true }`

---

## Phase 5 — Offline World Evolution (Scheduled Function)

### `evolveWorld` Cloud Function (scheduled: every 24h)
**Steps**:
1. Query all worlds with `status === 'active'` and `lastEvolvedAt < 24h ago`
2. For each world (batched, max 10 concurrent):
   a. Load characters + plot threads from Firestore
   b. Call Claude with "advance world by N days" prompt
   c. Parse response: updated character states, plot thread progress, new events
   d. Write changes to Firestore
   e. Write `EvolutionLog` document
   f. Update `world.lastEvolvedAt`
3. On next user login → fetch latest evolution log → show "while you were away" summary

---

## Phase 6 — Mobile (Expo + React Native)

### Scope (feature parity with web MVP)
- `apps/mobile/` — Expo Router + React Native
- Shared types from `packages/shared`
- Same Firebase backend
- Auth flow (email + Google)
- World browser screen
- Session chat screen with streaming
- Character panel

### Key difference from web
- No SSE streaming — use Firebase Realtime updates or polling
- Native navigation (Expo Router)
- AsyncStorage for offline state

---

## Phase 7 — Paywall + Polish + Tests

### Paywall
- Stripe Checkout integration (or Firebase Extensions)
- Quota tiers: Free (1 world, 50 msg/mo) | Pro (unlimited)
- Webhook → update `quota.tier` in Firestore

### Polish
- Loading skeletons, error boundaries, empty states
- Optimistic UI updates on message send
- World/character image loading states

### Tests
- Vitest: shared type validators, quota logic, prompt builders
- Playwright E2E: auth flow, world creation flow, session flow

---

## Firestore Security Rules Summary

```
// Default deny
match /{document=**} { allow read, write: if false; }

// Users can only read/write their own data
match /users/{uid} { allow read, write: if request.auth.uid == uid; }

// Worlds: owner-only access
match /worlds/{worldId} {
  allow read, write: if request.auth.uid == resource.data.ownerId;
  // All subcollections inherit owner check
  match /{subCol}/{docId} {
    allow read, write: if request.auth.uid == get(/databases/$(database)/documents/worlds/$(worldId)).data.ownerId;
  }
}
```

---

## Commit Convention

```
feat(scope): description
fix(scope): description
docs: description
chore(scope): description
test(scope): description
```

Scopes: `auth`, `world`, `session`, `functions`, `shared`, `mobile`, `infra`

---

## Checkpoints

| # | After | Review |
|---|---|---|
| 1 | Phase 0 | Docs + scaffold looks correct |
| 2 | Phase 1 | Types + schemas complete |
| 3 | Phase 2 | Auth works end-to-end |
| 4 | Phase 3 | World creation works with real AI |
| 5 | Phase 4 | Streaming session works |
| 6 | Phase 5 | Evolution runs on schedule |
| 7 | Phase 6 | Mobile parity |
| 8 | Phase 7 | Tests + paywall |
