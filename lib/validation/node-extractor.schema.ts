import { z } from "zod";

import type { SuggestedNodeDraft } from "@/types/database";

export const NODE_EXTRACTOR_MAX_SUGGESTIONS = 5;
export const NODE_EXTRACTOR_TITLE_MAX_LENGTH = 255;

const nullableDescriptionSchema = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional();

export const extractedSuggestedNodeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Suggested node title is required")
    .max(NODE_EXTRACTOR_TITLE_MAX_LENGTH),
  description: nullableDescriptionSchema,
});

export const nodeExtractorLlmOutputSchema = z
  .array(extractedSuggestedNodeSchema)
  .max(NODE_EXTRACTOR_MAX_SUGGESTIONS);

export const nodeExtractorLlmWrappedOutputSchema = z.object({
  suggestions: nodeExtractorLlmOutputSchema,
});

export type ExtractedSuggestedNodeSchema = z.infer<
  typeof extractedSuggestedNodeSchema
>;

function toSuggestedNodeDraft(
  item: ExtractedSuggestedNodeSchema,
): SuggestedNodeDraft {
  return {
    title: item.title,
    description: item.description ?? null,
  };
}

function unwrapNodeExtractorPayload(value: unknown): unknown {
  const wrapped = nodeExtractorLlmWrappedOutputSchema.safeParse(value);
  if (wrapped.success) {
    return wrapped.data.suggestions;
  }

  return value;
}

export function parseNodeExtractorLlmValue(
  value: unknown,
): readonly SuggestedNodeDraft[] {
  const parsed = nodeExtractorLlmOutputSchema.safeParse(
    unwrapNodeExtractorPayload(value),
  );

  if (!parsed.success) {
    return [];
  }

  return parsed.data.map(toSuggestedNodeDraft);
}

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);

  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  return trimmed;
}

export function parseNodeExtractorLlmJson(
  raw: string,
): readonly SuggestedNodeDraft[] {
  try {
    const value: unknown = JSON.parse(extractJsonText(raw));
    return parseNodeExtractorLlmValue(value);
  } catch {
    return [];
  }
}
