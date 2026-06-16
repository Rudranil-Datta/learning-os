import { z } from "zod";

import {
  SEARCH_MAX_LENGTH,
  SEARCH_MIN_LENGTH,
} from "@/lib/utils/search";

const optionalTextField = z.string().trim().nullable().optional();

const metadataSchema = z.record(z.string(), z.unknown()).optional();

export const nodeSearchQueryParamSchema = z
  .string()
  .transform((value) =>
    value.replace(/\0/g, "").trim().replace(/\s+/g, " "),
  )
  .refine((value) => value.length === 0 || value.length >= SEARCH_MIN_LENGTH, {
    message: "Search query is too short",
  })
  .refine((value) => value.length <= SEARCH_MAX_LENGTH, {
    message: `Search query must be at most ${SEARCH_MAX_LENGTH} characters`,
  });

export const listNodesQuerySchema = z.object({
  q: nodeSearchQueryParamSchema.optional(),
});

export type ListNodesQuerySchema = z.infer<typeof listNodesQuerySchema>;

export type ParseNodeSearchQueryResult =
  | { readonly success: true; readonly searchQuery: string | undefined }
  | { readonly success: false; readonly error: z.ZodError };

export function parseNodeSearchQueryParam(
  raw: string | null,
): ParseNodeSearchQueryResult {
  if (raw === null) {
    return { success: true, searchQuery: undefined };
  }

  const parsed = nodeSearchQueryParamSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  return {
    success: true,
    searchQuery: parsed.data.length === 0 ? undefined : parsed.data,
  };
}

export const createKnowledgeNodeSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: optionalTextField,
  explanation: optionalTextField,
  summary: optionalTextField,
  metadata: metadataSchema,
});

export const updateKnowledgeNodeSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    description: optionalTextField,
    explanation: optionalTextField,
    summary: optionalTextField,
    metadata: metadataSchema,
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.explanation !== undefined ||
      data.summary !== undefined ||
      data.metadata !== undefined,
    { message: "At least one field must be provided" },
  );

export type CreateKnowledgeNodeSchema = z.infer<typeof createKnowledgeNodeSchema>;
export type UpdateKnowledgeNodeSchema = z.infer<typeof updateKnowledgeNodeSchema>;
