import { z } from "zod";

const suggestionIdSchema = z.string().uuid();

export const confirmSuggestionsSchema = z.object({
  suggestionIds: z
    .array(suggestionIdSchema)
    .min(1, "At least one suggestion id is required")
    .max(50, "Too many suggestion ids"),
  contextNodeId: suggestionIdSchema.optional(),
});

export const suggestionIdParamSchema = z.object({
  suggestionId: suggestionIdSchema,
});

export type ConfirmSuggestionsSchema = z.infer<typeof confirmSuggestionsSchema>;
export type SuggestionIdParamSchema = z.infer<typeof suggestionIdParamSchema>;
