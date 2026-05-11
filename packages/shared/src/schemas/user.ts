import { z } from 'zod';
import { PlanSchema } from './plan.js';

// LEARN: ISO 8601 string is the WIRE format used across the network.
// Firestore Timestamp objects are converted to/from ISO strings at the
// Functions boundary (see apps/functions converters in Phase 4). The
// shared schemas describe the canonical "decoded" shape that flows
// through HTTPS calls and the typed Firestore reads.
export const UserSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1).max(100).nullable(),
  photoURL: z.string().url().nullable(),
  plan: PlanSchema,
  stripeCustomerId: z.string().min(1).nullable(),
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;
