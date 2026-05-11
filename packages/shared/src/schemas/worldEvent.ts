import { z } from 'zod';

export const WorldEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  charactersInvolved: z.array(z.string().min(1)).max(20),
  // `occurredAt` is in-world time; `createdAt` is wall-clock real time.
  // They differ because the scheduler advances world time in 6h jumps
  // while only running every 6h of real time.
  occurredAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});
export type WorldEvent = z.infer<typeof WorldEventSchema>;
