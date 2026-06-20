import { z } from "zod";

const uuidSchema = z.string().uuid();

export const sideChatRequestSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(8000),
  conversationId: uuidSchema.optional(),
  contextNodeId: uuidSchema,
});

export type SideChatRequestSchema = z.infer<typeof sideChatRequestSchema>;
