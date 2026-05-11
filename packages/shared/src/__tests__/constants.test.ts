import { describe, it, expect } from 'vitest';
import {
  PLAN_LIMITS,
  MODELS,
  PROMPT_VERSIONS,
  TICK_INTERVAL_MS,
  SESSION_CONTEXT_MESSAGES,
  MEMORY_RESUMMARIZE_EVERY,
  WORLD_DORMANT_AFTER_DAYS,
  WORLD_GEN_BOUNDS,
} from '../constants.js';

// LEARN: We test constants for two reasons:
//   1. Catch accidental edits (someone halves messagesPerMonth in a
//      refactor, no test catches the regression downstream).
//   2. Encode invariants that aren't otherwise enforced: pro must be
//      strictly more generous than free, bounds must be sane, etc.

describe('PLAN_LIMITS', () => {
  it('pro grants strictly more than free', () => {
    expect(PLAN_LIMITS.pro.worlds).toBeGreaterThan(PLAN_LIMITS.free.worlds);
    expect(PLAN_LIMITS.pro.messagesPerMonth).toBeGreaterThan(
      PLAN_LIMITS.free.messagesPerMonth,
    );
    expect(PLAN_LIMITS.pro.messagesPerDay).toBeGreaterThan(
      PLAN_LIMITS.free.messagesPerDay,
    );
  });

  it('daily cap fits inside monthly cap on both plans', () => {
    // A single day's worth of messages shouldn't bust the monthly
    // budget on day one. If it does, the daily cap is broken.
    expect(PLAN_LIMITS.free.messagesPerDay).toBeLessThanOrEqual(
      PLAN_LIMITS.free.messagesPerMonth,
    );
    expect(PLAN_LIMITS.pro.messagesPerDay).toBeLessThanOrEqual(
      PLAN_LIMITS.pro.messagesPerMonth,
    );
  });
});

describe('MODELS', () => {
  it('claude is pinned to a Sonnet 4.x line', () => {
    expect(MODELS.claude).toMatch(/^claude-sonnet-4-/);
  });
});

describe('PROMPT_VERSIONS', () => {
  it('all prompt versions are positive integers', () => {
    for (const [name, v] of Object.entries(PROMPT_VERSIONS)) {
      expect(Number.isInteger(v), `${name} version not integer`).toBe(true);
      expect(v, `${name} version not positive`).toBeGreaterThan(0);
    }
  });
});

describe('timing constants', () => {
  it('TICK_INTERVAL_MS equals 6 hours', () => {
    expect(TICK_INTERVAL_MS).toBe(6 * 60 * 60 * 1000);
  });

  it('session context is a reasonable size', () => {
    expect(SESSION_CONTEXT_MESSAGES).toBeGreaterThanOrEqual(10);
    expect(SESSION_CONTEXT_MESSAGES).toBeLessThanOrEqual(50);
  });

  it('memory re-summarize interval is small enough to keep summary fresh', () => {
    expect(MEMORY_RESUMMARIZE_EVERY).toBeGreaterThanOrEqual(5);
    expect(MEMORY_RESUMMARIZE_EVERY).toBeLessThanOrEqual(30);
  });

  it('dormant cutoff is at least a week', () => {
    expect(WORLD_DORMANT_AFTER_DAYS).toBeGreaterThanOrEqual(7);
  });
});

describe('WORLD_GEN_BOUNDS', () => {
  it('every bound has min < max', () => {
    for (const [name, { min, max }] of Object.entries(WORLD_GEN_BOUNDS)) {
      expect(min, `${name} min not positive`).toBeGreaterThan(0);
      expect(max, `${name} max <= min`).toBeGreaterThan(min);
    }
  });
});
