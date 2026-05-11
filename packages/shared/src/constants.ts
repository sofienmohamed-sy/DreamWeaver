import type { Plan } from './schemas/plan.js';

// LEARN: All magic numbers live here, exported as `as const` literals.
// Importing them from one place means a rate-limit tweak is a single
// commit, never a search-and-replace. The `as const` keeps the inferred
// type as narrow literals (`50` not `number`), which means the compiler
// catches a typo like `if (used > FREE_LIMITS.messagesPerMonth + 1)`
// at the call site.

export interface PlanLimits {
  readonly worlds: number;
  readonly messagesPerMonth: number;
  readonly messagesPerDay: number;
}

export const PLAN_LIMITS = {
  free: {
    worlds: 1,
    messagesPerMonth: 50,
    messagesPerDay: 10,
  },
  pro: {
    worlds: 10,
    messagesPerMonth: 2000,
    messagesPerDay: 200,
  },
} as const satisfies Record<Plan, PlanLimits>;
// LEARN: `satisfies` checks the shape against the constraint WITHOUT
// widening the literal types. `as const` alone would give the right
// types but no compile error if we forgot a plan; `: Record<Plan, ...>`
// would give the check but widen the literals. Together they give us
// both: exhaustiveness AND narrow literal types.

// Anthropic + Gemini model IDs (single source of truth).
export const MODELS = {
  claude: 'claude-sonnet-4-6',
  // The Gemini image model used for character portraits. Confirm
  // against current Gemini docs at Phase 5 before shipping.
  geminiImage: 'gemini-2.5-flash-image',
} as const;

// Bump a prompt's version when its text changes. The Anthropic cache
// keys off the exact text + cache_control config, so version bumps
// naturally invalidate the cache. We also include the version in
// telemetry so we can A/B prompts later without ambiguity.
export const PROMPT_VERSIONS = {
  worldGen: 1,
  session: 1,
  tickWorld: 1,
  memoryExtract: 1,
} as const;

// Scheduled tickWorld cadence — six hours.
export const TICK_INTERVAL_MS = 6 * 60 * 60 * 1000;

// Number of recent messages kept in the active session prompt context.
export const SESSION_CONTEXT_MESSAGES = 20;

// How many new memory rows trigger a memorySummary re-roll.
export const MEMORY_RESUMMARIZE_EVERY = 10;

// Worlds untouched for longer than this stop being ticked.
export const WORLD_DORMANT_AFTER_DAYS = 14;

// World generation bounds — used by both the prompt and the Zod
// validation of Claude's output (so the prompt's "produce 3-6
// locations" matches the schema's `.min(3).max(6)` exactly).
export const WORLD_GEN_BOUNDS = {
  locations: { min: 3, max: 6 },
  characters: { min: 4, max: 8 },
  plotThreads: { min: 2, max: 4 },
} as const;
