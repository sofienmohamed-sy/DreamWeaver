import { describe, it, expect } from 'vitest';
import {
  PlanSchema,
  UserSchema,
  QuotaSchema,
  MonthKeySchema,
  DayKeySchema,
  LocationSchema,
  CharacterSchema,
  BigFiveSchema,
  PortraitStatusSchema,
  MemorySchema,
  PlotThreadSchema,
  PlotThreadStateSchema,
  WorldSchema,
  WorldStatusSchema,
  PremiseSchema,
  SessionSchema,
  MessageSchema,
  MessageRoleSchema,
  WorldEventSchema,
  WorldGenOutputSchema,
} from '../schemas/index.js';

// LEARN: Each schema gets a positive case (verifies the happy path
// parses cleanly) AND at least one negative case (verifies a realistic
// bad input is REJECTED). The negative case is the more valuable one —
// it's what catches drift between "what we documented" and "what we
// enforce."

describe('PlanSchema', () => {
  it('accepts free and pro', () => {
    expect(PlanSchema.parse('free')).toBe('free');
    expect(PlanSchema.parse('pro')).toBe('pro');
  });

  it('rejects unknown tiers', () => {
    expect(() => PlanSchema.parse('enterprise')).toThrow();
    expect(() => PlanSchema.parse('')).toThrow();
  });
});

describe('MonthKeySchema / DayKeySchema', () => {
  it('accepts well-formed keys', () => {
    expect(MonthKeySchema.parse('2026-05')).toBe('2026-05');
    expect(DayKeySchema.parse('2026-05-11')).toBe('2026-05-11');
  });

  it('rejects malformed keys', () => {
    expect(() => MonthKeySchema.parse('2026-5')).toThrow();
    expect(() => MonthKeySchema.parse('2026-13')).toThrow();
    expect(() => MonthKeySchema.parse('26-05')).toThrow();
    expect(() => DayKeySchema.parse('2026-05-32')).toThrow();
    expect(() => DayKeySchema.parse('2026-13-01')).toThrow();
  });
});

describe('QuotaSchema', () => {
  const valid = {
    monthKey: '2026-05',
    messagesUsed: 7,
    worldsCreated: 1,
    messagesToday: 3,
    dayKey: '2026-05-11',
  };

  it('parses a valid quota', () => {
    expect(QuotaSchema.parse(valid)).toEqual(valid);
  });

  it('rejects negative counters', () => {
    expect(() => QuotaSchema.parse({ ...valid, messagesUsed: -1 })).toThrow();
  });

  it('rejects non-integer counters', () => {
    expect(() => QuotaSchema.parse({ ...valid, messagesUsed: 1.5 })).toThrow();
  });
});

describe('UserSchema', () => {
  const valid = {
    uid: 'abc123',
    email: 'a@b.com',
    displayName: 'Alice',
    photoURL: 'https://example.com/p.png',
    plan: 'free' as const,
    stripeCustomerId: null,
    createdAt: '2026-05-11T12:00:00.000Z',
  };

  it('parses a valid user', () => {
    expect(UserSchema.parse(valid)).toEqual(valid);
  });

  it('allows null displayName and photoURL', () => {
    expect(
      UserSchema.parse({ ...valid, displayName: null, photoURL: null }),
    ).toMatchObject({ displayName: null, photoURL: null });
  });

  it('rejects bad email', () => {
    expect(() => UserSchema.parse({ ...valid, email: 'not-an-email' })).toThrow();
  });

  it('rejects non-ISO createdAt', () => {
    expect(() => UserSchema.parse({ ...valid, createdAt: 'yesterday' })).toThrow();
  });
});

describe('LocationSchema', () => {
  it('parses a valid location', () => {
    expect(
      LocationSchema.parse({
        id: 'loc1',
        name: 'The Drowned Library',
        description: 'A flooded archive whose shelves still whisper.',
        neighborIds: ['loc2', 'loc3'],
      }),
    ).toBeDefined();
  });

  it('rejects empty name', () => {
    expect(() =>
      LocationSchema.parse({
        id: 'loc1',
        name: '',
        description: 'x',
        neighborIds: [],
      }),
    ).toThrow();
  });
});

describe('BigFiveSchema', () => {
  it('accepts integers in 0..100', () => {
    expect(
      BigFiveSchema.parse({
        openness: 70,
        conscientiousness: 50,
        extraversion: 40,
        agreeableness: 60,
        neuroticism: 30,
      }),
    ).toBeDefined();
  });

  it('rejects out-of-range values', () => {
    expect(() =>
      BigFiveSchema.parse({
        openness: 101,
        conscientiousness: 50,
        extraversion: 40,
        agreeableness: 60,
        neuroticism: 30,
      }),
    ).toThrow();
  });

  it('rejects non-integer values', () => {
    expect(() =>
      BigFiveSchema.parse({
        openness: 70.5,
        conscientiousness: 50,
        extraversion: 40,
        agreeableness: 60,
        neuroticism: 30,
      }),
    ).toThrow();
  });
});

describe('PortraitStatusSchema', () => {
  it('accepts known states', () => {
    expect(PortraitStatusSchema.parse('pending')).toBe('pending');
    expect(PortraitStatusSchema.parse('ready')).toBe('ready');
    expect(PortraitStatusSchema.parse('error')).toBe('error');
  });
});

describe('CharacterSchema', () => {
  const valid = {
    id: 'char1',
    name: 'Ezra',
    age: 34,
    personality: {
      bigFive: {
        openness: 80,
        conscientiousness: 50,
        extraversion: 30,
        agreeableness: 65,
        neuroticism: 45,
      },
      traits: ['curious', 'haunted'],
    },
    goals: ['Find the lost manuscript', 'Avoid the Cartel'],
    currentLocationId: 'loc1',
    portraitUrl: null,
    portraitStatus: 'pending' as const,
    memorySummary: '',
  };

  it('parses a valid character', () => {
    expect(CharacterSchema.parse(valid)).toBeDefined();
  });

  it('rejects empty goals array', () => {
    expect(() => CharacterSchema.parse({ ...valid, goals: [] })).toThrow();
  });

  it('rejects too many goals', () => {
    expect(() =>
      CharacterSchema.parse({ ...valid, goals: ['a', 'b', 'c', 'd', 'e', 'f'] }),
    ).toThrow();
  });
});

describe('MemorySchema', () => {
  it('parses a valid memory', () => {
    expect(
      MemorySchema.parse({
        id: 'mem1',
        summary: 'User mentioned growing up on the docks.',
        importance: 4,
        createdAt: '2026-05-11T12:00:00.000Z',
        sessionId: 'sess1',
        eventId: null,
      }),
    ).toBeDefined();
  });

  it('rejects importance outside 1..5', () => {
    expect(() =>
      MemorySchema.parse({
        id: 'mem1',
        summary: 'x',
        importance: 6,
        createdAt: '2026-05-11T12:00:00.000Z',
        sessionId: null,
        eventId: null,
      }),
    ).toThrow();
  });
});

describe('PlotThreadSchema', () => {
  it('accepts active|resolved|dormant', () => {
    for (const state of ['active', 'resolved', 'dormant'] as const) {
      expect(PlotThreadStateSchema.parse(state)).toBe(state);
    }
  });

  it('parses a thread', () => {
    expect(
      PlotThreadSchema.parse({
        id: 't1',
        title: 'The Cartel hunts Ezra',
        summary: 'A subplot brewing in the shadows.',
        state: 'active',
        participantIds: ['char1', 'char2'],
      }),
    ).toBeDefined();
  });
});

describe('WorldSchema', () => {
  const valid = {
    id: 'world1',
    ownerId: 'user1',
    title: 'The Drowned City',
    premise: 'A city half-submerged. Memory leaks from the walls. The tide is rising.',
    status: 'ready' as const,
    worldTime: '2026-05-11T12:00:00.000Z',
    createdAt: '2026-05-11T12:00:00.000Z',
    updatedAt: '2026-05-11T12:00:00.000Z',
  };

  it('parses a valid world', () => {
    expect(WorldSchema.parse(valid)).toBeDefined();
  });

  it('rejects too-short premise', () => {
    expect(() => WorldSchema.parse({ ...valid, premise: 'short' })).toThrow();
  });

  it('rejects too-long premise', () => {
    expect(() =>
      WorldSchema.parse({ ...valid, premise: 'a'.repeat(501) }),
    ).toThrow();
  });

  it('rejects unknown status', () => {
    // LEARN: Casting to a type the function doesn't accept is the
    // standard way to test schema-level rejection of invalid input.
    // We use `as unknown as ...` (not `as any`) because the project
    // bans `any`.
    expect(() =>
      WorldSchema.parse({ ...valid, status: 'pending' as unknown as 'ready' }),
    ).toThrow();
  });
});

describe('PremiseSchema', () => {
  it('enforces length bounds', () => {
    expect(() => PremiseSchema.parse('a'.repeat(9))).toThrow();
    expect(PremiseSchema.parse('a'.repeat(10))).toBeDefined();
    expect(PremiseSchema.parse('a'.repeat(500))).toBeDefined();
    expect(() => PremiseSchema.parse('a'.repeat(501))).toThrow();
  });
});

describe('SessionSchema', () => {
  it('accepts null endedAt', () => {
    expect(
      SessionSchema.parse({
        id: 's1',
        userId: 'u1',
        locationId: 'loc1',
        startedAt: '2026-05-11T12:00:00.000Z',
        endedAt: null,
      }),
    ).toBeDefined();
  });
});

describe('MessageSchema', () => {
  it('accepts role enum values', () => {
    for (const role of ['user', 'assistant', 'system'] as const) {
      expect(MessageRoleSchema.parse(role)).toBe(role);
    }
  });

  it('parses a user message with null tokens', () => {
    expect(
      MessageSchema.parse({
        id: 'm1',
        role: 'user',
        text: 'Where am I?',
        createdAt: '2026-05-11T12:00:00.000Z',
        charactersPresent: ['char1'],
        promptTokens: null,
        completionTokens: null,
      }),
    ).toBeDefined();
  });

  it('rejects empty text', () => {
    expect(() =>
      MessageSchema.parse({
        id: 'm1',
        role: 'user',
        text: '',
        createdAt: '2026-05-11T12:00:00.000Z',
        charactersPresent: [],
        promptTokens: null,
        completionTokens: null,
      }),
    ).toThrow();
  });
});

describe('WorldStatusSchema', () => {
  it('accepts the three states', () => {
    expect(WorldStatusSchema.parse('generating')).toBe('generating');
    expect(WorldStatusSchema.parse('ready')).toBe('ready');
    expect(WorldStatusSchema.parse('error')).toBe('error');
  });
});

describe('WorldEventSchema', () => {
  it('parses an event', () => {
    expect(
      WorldEventSchema.parse({
        id: 'e1',
        title: 'Ezra discovered a clue',
        description: 'While the user was away, Ezra found a torn map.',
        charactersInvolved: ['char1'],
        occurredAt: '2026-05-11T18:00:00.000Z',
        createdAt: '2026-05-11T18:00:00.000Z',
      }),
    ).toBeDefined();
  });
});

describe('WorldGenOutputSchema', () => {
  const validOutput = {
    title: 'The Drowned City',
    locations: [
      { name: 'A', description: 'desc', neighborNames: ['B'] },
      { name: 'B', description: 'desc', neighborNames: ['A'] },
      { name: 'C', description: 'desc', neighborNames: [] },
    ],
    characters: [
      {
        name: 'Char A',
        age: 30,
        personality: {
          bigFive: {
            openness: 50,
            conscientiousness: 50,
            extraversion: 50,
            agreeableness: 50,
            neuroticism: 50,
          },
          traits: [],
        },
        goals: ['x'],
        startingLocationName: 'A',
        portraitPrompt: 'portrait',
      },
      {
        name: 'Char B',
        age: 30,
        personality: {
          bigFive: {
            openness: 50,
            conscientiousness: 50,
            extraversion: 50,
            agreeableness: 50,
            neuroticism: 50,
          },
          traits: [],
        },
        goals: ['x'],
        startingLocationName: 'A',
        portraitPrompt: 'portrait',
      },
      {
        name: 'Char C',
        age: 30,
        personality: {
          bigFive: {
            openness: 50,
            conscientiousness: 50,
            extraversion: 50,
            agreeableness: 50,
            neuroticism: 50,
          },
          traits: [],
        },
        goals: ['x'],
        startingLocationName: 'A',
        portraitPrompt: 'portrait',
      },
      {
        name: 'Char D',
        age: 30,
        personality: {
          bigFive: {
            openness: 50,
            conscientiousness: 50,
            extraversion: 50,
            agreeableness: 50,
            neuroticism: 50,
          },
          traits: [],
        },
        goals: ['x'],
        startingLocationName: 'A',
        portraitPrompt: 'portrait',
      },
    ],
    plotThreads: [
      {
        title: 'T1',
        summary: 's',
        state: 'active' as const,
        participantCharacterNames: ['Char A'],
      },
      {
        title: 'T2',
        summary: 's',
        state: 'active' as const,
        participantCharacterNames: ['Char B'],
      },
    ],
  };

  it('parses a representative valid output', () => {
    expect(WorldGenOutputSchema.parse(validOutput)).toBeDefined();
  });

  it('rejects fewer than 3 locations', () => {
    expect(() =>
      WorldGenOutputSchema.parse({
        ...validOutput,
        locations: validOutput.locations.slice(0, 2),
      }),
    ).toThrow();
  });

  it('rejects fewer than 4 characters', () => {
    expect(() =>
      WorldGenOutputSchema.parse({
        ...validOutput,
        characters: validOutput.characters.slice(0, 3),
      }),
    ).toThrow();
  });

  it('rejects extra unknown keys (.strict())', () => {
    // LEARN: This is the test that proves Claude can't smuggle a
    // field like "secretRules" into our database — strict() makes the
    // parse fail rather than silently dropping or persisting it.
    const withExtra = {
      ...validOutput,
      surprise: 'hello',
    };
    expect(() => WorldGenOutputSchema.parse(withExtra)).toThrow();
  });
});
