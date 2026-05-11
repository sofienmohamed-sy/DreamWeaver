import { PROMPT_VERSIONS } from '../constants.js';

export const MEMORY_EXTRACT_SYSTEM_PROMPT = `You extract durable memories from a roleplay exchange.

Given the user's message, the assistant's response, and the list of characters present (with their IDs), output STRICT JSON: an array of objects with shape { characterId, summary, importance }.

- characterId: must match one of the characters present.
- summary: 1-2 sentences capturing what the character should remember. Specific, not generic.
- importance: integer 1-5. Lower for trivia, higher for identity-shaping or relationship-shaping moments.

Only include memories that are:
- Specific (not "the user was friendly" — instead "the user revealed they grew up on the docks").
- Relevant to who the character is or what's happening in their thread.
- Worth keeping (importance >= 2).

Empty array is valid if nothing memorable happened.`;

export const MEMORY_EXTRACT_SYSTEM_PROMPT_VERSION = PROMPT_VERSIONS.memoryExtract;
