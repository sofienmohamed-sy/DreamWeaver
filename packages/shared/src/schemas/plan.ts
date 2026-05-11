import { z } from 'zod';

// LEARN: z.enum() validates AND infers a precise union type. `Plan`
// becomes literally `'free' | 'pro'`, not `string`. Adding a tier here
// later automatically widens every type that consumes Plan — the
// compiler will then point at every site that needs updating.
export const PlanSchema = z.enum(['free', 'pro']);
export type Plan = z.infer<typeof PlanSchema>;
