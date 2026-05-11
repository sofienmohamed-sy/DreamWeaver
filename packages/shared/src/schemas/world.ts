import { z } from 'zod';

export const WorldStatusSchema = z.enum(['generating', 'ready', 'error']);
export type WorldStatus = z.infer<typeof WorldStatusSchema>;

// LEARN: Constraining the premise length here, in the shared schema,
// means web, mobile, AND the Function all enforce the same bound. If
// we put validation only on the form, a malicious client could bypass
// it. If we put it only in the Function, the web form gives no inline
// feedback. Zod in the middle wins both.
export const PremiseSchema = z
  .string()
  .min(10, 'premise must be at least 10 characters')
  .max(500, 'premise must be at most 500 characters');
export type Premise = z.infer<typeof PremiseSchema>;

export const WorldSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  title: z.string().min(1).max(200),
  premise: PremiseSchema,
  status: WorldStatusSchema,
  // In-world time (advances 6h per scheduled tick).
  worldTime: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type World = z.infer<typeof WorldSchema>;
