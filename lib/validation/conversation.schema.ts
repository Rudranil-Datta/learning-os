import { z } from "zod";

export const getOrCreateSideConversationSchema = z.object({
  contextNodeId: z.string().uuid(),
});
