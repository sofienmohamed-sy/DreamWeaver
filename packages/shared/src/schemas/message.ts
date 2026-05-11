import { z } from 'zod';

export const MessageRoleSchema = z.enum(['user', 'assistant', 'system']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const MessageSchema = z.object({
  id: z.string().min(1),
  role: MessageRoleSchema,
  text: z.string().min(1).max(8000),
  createdAt: z.string().datetime(),
  charactersPresent: z.array(z.string().min(1)).max(20),
  // LEARN: Token counts are populated AFTER the Claude call completes.
  // For user/system messages they remain null. We keep them nullable
  // rather than optional so every doc has the same key set — Firestore
  // queries on existence-of-field get much simpler.
  promptTokens: z.number().int().nonnegative().nullable(),
  completionTokens: z.number().int().nonnegative().nullable(),
});
export type Message = z.infer<typeof MessageSchema>;
