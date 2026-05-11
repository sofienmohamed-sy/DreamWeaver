import { z } from 'zod';
import { PersonalitySchema } from './character.js';
import { PlotThreadStateSchema } from './plotThread.js';

// LEARN: WorldGenOutput describes what Claude RETURNS at world
// creation — a STRICT subset of the persisted shapes.
//
//   - No IDs. The server mints UUIDs after parsing (don't trust an LLM
//     with primary keys).
//   - No timestamps. The server sets `createdAt`, `worldTime`, etc.
//   - No portrait URLs. Those are filled in later by `generatePortrait`.
//   - Cross-references use NAMES, not IDs (Claude doesn't know our IDs
//     yet — the server resolves names to IDs after parsing).
//
// `.strict()` is critical: if Claude invents an extra key, the parse
// fails fast and we don't accidentally persist garbage to Firestore.
const GenLocationSchema = z
  .object({
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(2000),
    neighborNames: z.array(z.string().min(1)).max(20),
  })
  .strict();

const GenCharacterSchema = z
  .object({
    name: z.string().min(1).max(100),
    age: z.number().int().min(0).max(10_000),
    personality: PersonalitySchema,
    goals: z.array(z.string().min(1).max(300)).min(1).max(5),
    startingLocationName: z.string().min(1).max(100),
    // Visual portrait prompt for Gemini. No proper nouns; describes
    // the look (hair, clothing, mood, art style).
    portraitPrompt: z.string().min(1).max(500),
  })
  .strict();

const GenPlotThreadSchema = z
  .object({
    title: z.string().min(1).max(200),
    summary: z.string().min(1).max(1000),
    state: PlotThreadStateSchema,
    participantCharacterNames: z.array(z.string().min(1)).max(20),
  })
  .strict();

export const WorldGenOutputSchema = z
  .object({
    title: z.string().min(1).max(200),
    locations: z.array(GenLocationSchema).min(3).max(6),
    characters: z.array(GenCharacterSchema).min(4).max(8),
    plotThreads: z.array(GenPlotThreadSchema).min(2).max(4),
  })
  .strict();
export type WorldGenOutput = z.infer<typeof WorldGenOutputSchema>;
