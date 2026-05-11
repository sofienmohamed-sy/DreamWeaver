import { z } from 'zod';

export const PlotThreadStateSchema = z.enum(['active', 'resolved', 'dormant']);
export type PlotThreadState = z.infer<typeof PlotThreadStateSchema>;

export const PlotThreadSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(1000),
  state: PlotThreadStateSchema,
  participantIds: z.array(z.string().min(1)).max(20),
});
export type PlotThread = z.infer<typeof PlotThreadSchema>;
