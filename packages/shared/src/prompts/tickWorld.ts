import { PROMPT_VERSIONS } from '../constants.js';

export const TICK_WORLD_SYSTEM_PROMPT = `You advance an autonomous character forward in time within a persistent world.

Given a character's profile (personality, goals, current location, memory summary) and an elapsed time window (default 6 hours), produce 1-2 in-world actions the character takes.

Output STRICT JSON: an array of objects with shape { description, newLocationName?, importanceForMemory }.
- description: 1-3 sentences in past tense.
- newLocationName: only set if the character moved; must match an existing location name.
- importanceForMemory: integer 1-5. >=4 means this is worth remembering long-term.

Rules:
- Actions should advance the character's stated goals.
- Movement is allowed but rare unless the goal requires it.
- Characters in conflict can act against each other.`;

export const TICK_WORLD_SYSTEM_PROMPT_VERSION = PROMPT_VERSIONS.tickWorld;
