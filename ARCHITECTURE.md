# ARCHITECTURE.md — DreamWeaver system design

## High-level data flow

```
┌─────────────┐      HTTPS callable      ┌──────────────────┐
│   Client    │ ──────────────────────▶  │ Firebase Function│
│  (web/RN)   │ ◀───── SSE stream ────── │   (Node 20 TS)   │
└─────────────┘                          └─────────┬────────┘
       │                                           │
       │                                           ├──▶  Anthropic Claude
       │   direct read (rules-gated)               ├──▶  Google Gemini
       ▼                                           ▼
┌─────────────┐                              ┌──────────┐
│  Firestore  │ ◀───── Admin SDK ─────────── │  (writes)│
└─────────────┘                              └──────────┘
       ▲
       │  scheduled writes (cron, every 6h)
┌──────┴───────┐
│  tickWorld   │
│  scheduler   │
└──────────────┘
```

Clients NEVER call Anthropic or Gemini directly — those keys live in Functions config.

Clients NEVER write to `users/*/plan`, `users/*/quotas/**`, or any AI-generated subcollection — those mutations go through Functions.

Clients DO read directly from Firestore (rules-gated) for world browsing and message lists — keeps the chat UI snappy via TanStack Query subscriptions.

## Streaming model

Session messages stream from Claude → Function → client over **Server-Sent Events (SSE)**.

- Function endpoint type: HTTPS (not callable) — callables don't support streaming response bodies.
- Client uses `fetch` with `ReadableStream` reader; renders token deltas into a Zustand-backed message state.
- On stream end, the function persists messages to Firestore (assistant message is the accumulated text).
- Memory extraction is fire-and-forget: a separate Claude call after the stream finishes, writing to the `memories` subcollection.

**Why SSE over WebSockets**: Functions v2 supports HTTP streaming natively; SSE is simpler (no socket lifecycle, no reconnect logic, plays well with HTTP/2). WebSockets would also require a different deployment target.

## Prompt-caching strategy

Anthropic prompt caching (`cache_control: { type: "ephemeral" }`) cuts per-message cost dramatically when the leading context is stable.

Cache blocks (per session message, in order):

1. **World facts block** — premise + locations summary. Stable until world is edited.
2. **Character sheets block** — active characters' personalities, goals, memory summaries. Stable until any character state changes.
3. **Recent messages block** — last 20 messages of the session. Dynamic, uncached.
4. **New user message** — uncached.

Cache hit rate target: **>80%** on blocks 1+2 (the expensive ones). Verified in the Phase 10 cost smoke test.

## Quota & rate-limit design

`users/{uid}/quotas/{YYYY-MM}` — one doc per user per month.

Fields:

- `monthKey: '2026-05'`
- `messagesUsed: number`
- `worldsCreated: number`
- `messagesToday: number` (resets when `dayKey` changes)
- `dayKey: '2026-05-11'`

Every quota-affecting call wraps in a Firestore transaction:

1. Read the current-month doc.
2. If the document doesn't exist OR its `monthKey` doesn't match → create/reset fields.
3. If `dayKey` doesn't match today → reset `messagesToday`.
4. Check against plan limits (read from `users/{uid}.plan`).
5. Increment.
6. Commit.

The transaction is the critical correctness barrier. Without it, two concurrent calls could both pass the check before either writes — letting a free user burn 51 messages.

## Scheduler — `tickWorld`

Runs on Cloud Scheduler every 6 hours.

Algorithm per tick:

1. Query worlds where `updatedAt > now - 14 days` AND `status == 'ready'`.
2. For each world (batched, with concurrency limit to spread Claude cost):
   - Advance `worldTime` by 6h.
   - For each character: Claude call (goals + current location + memory summary) → 1–2 actions.
   - Write `worldEvents` rows; update character `currentLocationId`, age.
   - For each plot thread: probability roll for advancement based on participant actions.
3. Update world `updatedAt` so abandoned worlds eventually fall out of the active set.

## Portrait generation — `generatePortrait`

A Cloud Tasks task function.

`createWorld` enqueues one task per character. Each task:

1. Calls Gemini with a portrait prompt derived from the character description.
2. Uploads the PNG to Firebase Storage at `worlds/{wid}/portraits/{cid}.png`.
3. Writes the public URL + `portraitStatus = 'ready'` back to the character doc.

Async ensures `createWorld` returns quickly; portraits stream into the UI via a Firestore listener on the character collection.

## Firestore schema (canonical)

```
users/{uid}                              # profile + plan
  └ quotas/{YYYY-MM}                     # rate-limit counters (one per month)

worlds/{worldId}                         # owned by users/{uid}
  ├ locations/{lid}
  ├ characters/{cid}
  │   └ memories/{mid}                   # per-character memory log
  ├ plotThreads/{tid}
  ├ sessions/{sid}
  │   └ messages/{mid}                   # chat log per session
  └ worldEvents/{eid}                    # offline-evolution event feed
```

See `packages/shared/src/schemas/` for the Zod definitions — single source of truth for shape.
See `firestore.rules` for access control.

## Composite indexes

- `messages` by `(sessionId asc, createdAt asc)` — session pagination
- `worldEvents` by `(worldId asc, occurredAt desc)` — "while you were away" feed
- `memories` by `(characterId asc, importance desc, createdAt desc)` — memory retrieval

## Type safety: single source of truth

Every shape lives ONCE: a Zod schema in `packages/shared/src/schemas/`.

```ts
export const WorldSchema = z.object({ /* ... */ });
export type World = z.infer<typeof WorldSchema>;
```

TS types are never declared in parallel to a schema. This ensures:

- Runtime validation matches compile-time types
- One file to update when adding a field
- Functions can `.parse()` inputs safely; clients can `.parse()` Firestore reads in dev mode

## Error taxonomy

Functions throw `HttpsError` with these codes:

| Code | Meaning | Client behavior |
|---|---|---|
| `unauthenticated` | No auth token | Redirect to sign-in |
| `permission-denied` | Auth but no access to resource | Show "not allowed" |
| `resource-exhausted` | Quota hit | Upgrade modal |
| `invalid-argument` | Zod parse failed on input | Inline form error |
| `internal` | Claude / Gemini call failed | Friendly retry button |

## Failure modes & resilience

- **Claude call fails**: Function retries once with exponential backoff; if still failing, throws `internal`; client offers a retry.
- **Gemini portrait fails**: Cloud Tasks retries built-in; after max retries, character `portraitStatus = 'error'`; UI shows a placeholder avatar.
- **Firestore write fails after Claude success**: log the lost generation; user retries (will re-burn quota — flagged for future idempotency-key fix).
- **Stripe webhook signature invalid**: 401, log, drop. Never process unsigned payloads.

## Future considerations (post-MVP — do NOT build now)

- Vector DB for richer memory recall (Pinecone / Weaviate)
- Multi-user worlds (shared roleplay sessions)
- Custom character creation
- Mobile native IAP
- World export / community sharing
- Voice input/output
