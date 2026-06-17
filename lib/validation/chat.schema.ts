import { z } from "zod";

const uuidSchema = z.string().uuid();

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(8000),
  conversationId: uuidSchema.optional(),
});

export type ChatRequestSchema = z.infer<typeof chatRequestSchema>;
