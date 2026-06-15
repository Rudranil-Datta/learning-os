import { z } from "zod";

const optionalTextField = z.string().trim().nullable().optional();

const metadataSchema = z.record(z.string(), z.unknown()).optional();

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
