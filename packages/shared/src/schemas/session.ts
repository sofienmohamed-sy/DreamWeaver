import { z } from 'zod';

export const SessionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  locationId: z.string().min(1),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable(),
});
export type Session = z.infer<typeof SessionSchema>;
