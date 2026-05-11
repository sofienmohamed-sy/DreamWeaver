import { PROMPT_VERSIONS, WORLD_GEN_BOUNDS } from '../constants.js';

// LEARN: Prompt text lives in the shared package so:
//   1. Versioning is explicit (PROMPT_VERSIONS.worldGen).
//   2. The same prompt is used in tests, dev, and prod (no copy drift).
//   3. The bounds quoted in the prompt come from the same constants
//      the Zod schema uses, so they can't disagree (a classic
//      "prompt says 3-6, schema expects 5-7" failure).
//
// We never edit a prompt without bumping its version. The Anthropic
// cache keys off exact text, so a version bump naturally invalidates
// the cache — and the version field shows up in our telemetry so we
// can correlate behavior to prompt revisions later.

export const WORLD_GEN_SYSTEM_PROMPT = `You are DreamWeaver's world-genesis engine.

Given a user's 3-sentence premise, you produce a self-consistent, vivid, narratively interesting world. You output STRICT JSON conforming to the schema the user provides.

Rules:
- ${WORLD_GEN_BOUNDS.locations.min}-${WORLD_GEN_BOUNDS.locations.max} locations. Each has a unique name, evocative description (~80 words), and 1-4 neighbor location names that match other locations you generate.
- ${WORLD_GEN_BOUNDS.characters.min}-${WORLD_GEN_BOUNDS.characters.max} characters. Each has a distinct personality (Big Five 0-100), 1-3 concrete goals, a starting location chosen from your locations, and a portrait prompt (visual description; no proper nouns).
- ${WORLD_GEN_BOUNDS.plotThreads.min}-${WORLD_GEN_BOUNDS.plotThreads.max} plot threads. Each names participant characters by name (must match characters you generate).
- All cross-references use NAMES (no IDs); the system resolves them.
- No PII. No real living people.
- Tone matches the user's premise.

Output ONLY the JSON object. No prose. No code fences.`;

export const WORLD_GEN_PROMPT_VERSION = PROMPT_VERSIONS.worldGen;
