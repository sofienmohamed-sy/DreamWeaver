import { z } from 'zod';

// LEARN: Big Five personality dimensions (OCEAN), each 0..100. Giving
// each character a numeric personality vector lets prompts be tighter
// ("write a high-Neuroticism, low-Agreeableness reaction") and makes
// later analytics possible. We bound the integer range explicitly so
// drift in AI output gets caught at parse time rather than producing
// "personality.openness = 9999" rows in Firestore.
export const BigFiveSchema = z.object({
  openness: z.number().int().min(0).max(100),
  conscientiousness: z.number().int().min(0).max(100),
  extraversion: z.number().int().min(0).max(100),
  agreeableness: z.number().int().min(0).max(100),
  neuroticism: z.number().int().min(0).max(100),
});
export type BigFive = z.infer<typeof BigFiveSchema>;

export const PersonalitySchema = z.object({
  bigFive: BigFiveSchema,
  traits: z.array(z.string().min(1).max(50)).max(10),
});
export type Personality = z.infer<typeof PersonalitySchema>;

export const PortraitStatusSchema = z.enum(['pending', 'ready', 'error']);
export type PortraitStatus = z.infer<typeof PortraitStatusSchema>;

export const CharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  // Some worlds have ageless beings; we cap high but allow 0 (newborns)
  // and let AI specify culturally-appropriate values within the bound.
  age: z.number().int().min(0).max(10_000),
  personality: PersonalitySchema,
  goals: z.array(z.string().min(1).max(300)).min(1).max(5),
  currentLocationId: z.string().min(1),
  portraitUrl: z.string().url().nullable(),
  portraitStatus: PortraitStatusSchema,
  // Rolling 1-paragraph memory summary, re-rolled every N additions.
  memorySummary: z.string().max(2000),
});
export type Character = z.infer<typeof CharacterSchema>;

export const MemorySchema = z.object({
  id: z.string().min(1),
  summary: z.string().min(1).max(500),
  importance: z.number().int().min(1).max(5),
  createdAt: z.string().datetime(),
  // A memory comes either from a session message or from an offline
  // world event — exactly one is populated. We don't enforce mutual
  // exclusion at the schema level because both being null is also
  // valid (e.g. a backfilled/imported memory).
  sessionId: z.string().min(1).nullable(),
  eventId: z.string().min(1).nullable(),
});
export type Memory = z.infer<typeof MemorySchema>;
