import { z } from 'zod';

// LEARN: Quota docs are keyed by month (YYYY-MM). When the calendar
// month rolls over, the next call reads a doc that doesn't exist yet,
// gets default zeros, and creates fresh counters — that IS the reset
// mechanism. No cron job, no expiry, no race window where "the old
// month's counter applied to the new month."
export const MonthKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'expected YYYY-MM');
export type MonthKey = z.infer<typeof MonthKeySchema>;

export const DayKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'expected YYYY-MM-DD');
export type DayKey = z.infer<typeof DayKeySchema>;

export const QuotaSchema = z.object({
  monthKey: MonthKeySchema,
  messagesUsed: z.number().int().nonnegative(),
  worldsCreated: z.number().int().nonnegative(),
  messagesToday: z.number().int().nonnegative(),
  dayKey: DayKeySchema,
});
export type Quota = z.infer<typeof QuotaSchema>;
