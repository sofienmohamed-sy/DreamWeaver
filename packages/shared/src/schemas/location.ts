import { z } from 'zod';

export const LocationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  neighborIds: z.array(z.string().min(1)).max(20),
});
export type Location = z.infer<typeof LocationSchema>;
