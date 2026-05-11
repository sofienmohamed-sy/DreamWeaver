# SPEC.md — DreamWeaver product spec

## One-liner

A Personal AI World you write into existence with three sentences and inhabit forever.

## User stories (MVP)

As a user, I can:

1. Sign up with email + password or Google OAuth.
2. Verify my email and recover my password.
3. Write a 3-sentence story idea and have the app generate a persistent world: locations, characters with personalities and goals, plot threads.
4. See AI-generated character portraits a few seconds after world creation.
5. Open my world and start a chat-style roleplay session with one or more characters.
6. See AI responses stream in token-by-token (first byte <500ms).
7. Return to my world hours or days later and find that characters have continued their lives in my absence — visible as a "while you were away" event feed.
8. Trust that characters remember meaningful things I said in past sessions.
9. Hit my message limit and be offered a clear upgrade path with no dark patterns.
10. Use the mobile app to continue sessions and browse my world on the go.

## Out of scope (MVP)

- Multi-user worlds (shared roleplay)
- Voice input/output
- Per-message image generation (only character portraits at world-creation time)
- Native mobile in-app purchase (web upgrade only)
- Vector DB / semantic memory retrieval
- World export / share links
- Custom character creation (AI-generated only)

## Plans

| Plan | Worlds | Messages / month | Messages / day | Price |
|---|---|---|---|---|
| Free | 1 | 50 | 10 | $0 |
| Pro | 10 | 2000 | 200 | $9.99 / mo *(TBC)* |

Rate-limit posture:

- **Calendar-month reset.** Quota doc is keyed `users/{uid}/quotas/{YYYY-MM}`; rolling over the month auto-resets.
- **Daily cap.** Prevents a user burning a month's worth in one sitting (especially important for free tier).
- **Server-side enforcement.** Both caps enforced transactionally before any AI call. Client UI is convenience only; never trusts itself.
- **Friendly upgrade modal** on quota-exceeded errors. Never a hard wall without a path forward.

## Cost projection (rough, revisit after Phase 8 telemetry)

Per session message, with prompt caching at >80% hit rate on system blocks (world facts + character sheets):

- Cached input: 5–10k tokens at ~$0.30 / Mtok = ~$0.003 per cache hit
- Fresh input: 200–500 tokens at ~$3 / Mtok = ~$0.001
- Output: 200–400 tokens at ~$15 / Mtok = ~$0.005

Estimated **~$0.01 per session message** at typical cache hit rate.

- 50 messages/month free = $0.50 worst-case cost per free user per month
- 2000 messages/month pro = ~$20 peak cost per pro user → $9.99 break-even depends on actual usage distribution

World creation: ~10k input tokens + ~5k output → ~$0.10 per world. Free user creates one; pro user up to ten.

Image generation: Gemini portrait API; assume <$0.10 per world (5–8 portraits). TBC after Phase 5 measurement.

## Feature behavior detail

### World creation

- User submits 3 sentences (10–500 chars total).
- Backend validates quota, calls Claude with cached world-gen system prompt + premise.
- Output is JSON-shaped, validated against `WorldGenSchema`: 3–6 locations, 4–8 characters, 2–4 plot threads.
- Batch-written to Firestore.
- Character portraits enqueued as Cloud Tasks; arrive async over ~30s.
- UX: world is browsable within 5–10 seconds; portraits fill in afterward via Firestore listener.

### Session messaging

- User opens a session at a location (default: a starting location set at world creation).
- Active characters = characters present at that location.
- User types a message; client validates locally; submits to streaming `sendMessage` endpoint.
- Server enforces auth + quota; builds prompt with cached blocks; streams Claude response over SSE.
- After stream completes: server persists user + assistant messages, fires memory-extraction job (separate small Claude call → JSON memory rows).

### Offline evolution

- Every 6 hours, scheduled function ticks each active world.
- For each character: Claude call → 1–2 actions for the elapsed window. Updates `currentLocationId`, ages by elapsed time, may shift goals.
- Events written to `worldEvents` collection.
- On user return, app shows a "while you were away" feed before the next chat turn.

### Paywall

- Quota tracked in `users/{uid}/quotas/{YYYY-MM}` (month-keyed Firestore doc).
- Daily counter on the same doc, with `dayKey` for the current day.
- On quota exceed, Function returns `resource-exhausted` `HttpsError`.
- Client maps that code → upgrade modal with one-click Stripe Checkout link.
- After payment, webhook flips `users/{uid}.plan = 'pro'`; client listens for the plan field.

## Open product decisions

- Pro tier exact price (suggest $9.99/mo).
- Free tier daily cap (suggest 10/day).
- Whether mobile gets world creation in v1 (suggest: no — web only).
