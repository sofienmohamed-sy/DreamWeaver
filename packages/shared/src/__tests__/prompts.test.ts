import { describe, it, expect } from 'vitest';
import {
  WORLD_GEN_SYSTEM_PROMPT,
  WORLD_GEN_PROMPT_VERSION,
  SESSION_SYSTEM_PROMPT,
  SESSION_SYSTEM_PROMPT_VERSION,
  TICK_WORLD_SYSTEM_PROMPT,
  TICK_WORLD_SYSTEM_PROMPT_VERSION,
  MEMORY_EXTRACT_SYSTEM_PROMPT,
  MEMORY_EXTRACT_SYSTEM_PROMPT_VERSION,
} from '../prompts/index.js';
import { WORLD_GEN_BOUNDS } from '../constants.js';

// LEARN: Prompt tests are deliberately not about content quality —
// that's an eval concern, not a unit-test concern. Here we only
// guarantee the structural invariants: the prompt mentions the same
// bounds the schema enforces, every prompt has a positive version
// number, prompts are non-empty. Drift between prompt text and schema
// bounds is the most expensive class of bug here — Claude will dutifully
// produce 7 locations when the schema rejects anything past 6.

describe('WORLD_GEN_SYSTEM_PROMPT', () => {
  it('is non-empty', () => {
    expect(WORLD_GEN_SYSTEM_PROMPT.length).toBeGreaterThan(50);
  });

  it('quotes the same location bounds the schema enforces', () => {
    const { min, max } = WORLD_GEN_BOUNDS.locations;
    expect(WORLD_GEN_SYSTEM_PROMPT).toContain(`${min}-${max} locations`);
  });

  it('quotes the same character bounds the schema enforces', () => {
    const { min, max } = WORLD_GEN_BOUNDS.characters;
    expect(WORLD_GEN_SYSTEM_PROMPT).toContain(`${min}-${max} characters`);
  });

  it('quotes the same plot-thread bounds the schema enforces', () => {
    const { min, max } = WORLD_GEN_BOUNDS.plotThreads;
    expect(WORLD_GEN_SYSTEM_PROMPT).toContain(`${min}-${max} plot threads`);
  });

  it('has a positive version', () => {
    expect(WORLD_GEN_PROMPT_VERSION).toBeGreaterThan(0);
  });
});

describe('all session prompts', () => {
  const prompts = [
    [SESSION_SYSTEM_PROMPT, SESSION_SYSTEM_PROMPT_VERSION, 'session'],
    [TICK_WORLD_SYSTEM_PROMPT, TICK_WORLD_SYSTEM_PROMPT_VERSION, 'tickWorld'],
    [
      MEMORY_EXTRACT_SYSTEM_PROMPT,
      MEMORY_EXTRACT_SYSTEM_PROMPT_VERSION,
      'memoryExtract',
    ],
  ] as const;

  it('every prompt is non-empty', () => {
    for (const [text, , name] of prompts) {
      expect(text.length, `${name} prompt empty`).toBeGreaterThan(50);
    }
  });

  it('every prompt has a positive version', () => {
    for (const [, version, name] of prompts) {
      expect(version, `${name} version`).toBeGreaterThan(0);
    }
  });
});
