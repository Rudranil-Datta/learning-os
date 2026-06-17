import { callOpenAI } from "@/lib/llm/client";
import {
  NODE_EXTRACTOR_MAX_SUGGESTIONS,
  parseNodeExtractorLlmJson,
} from "@/lib/validation/node-extractor.schema";
import type {
  NodeExtractorInput,
  NodeExtractorResult,
  SuggestedNodeDraft,
} from "@/types/database";
import type { ChatMessage } from "@/types/llm";

type CompleteFn = typeof callOpenAI;

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

function filterExistingTitles(
  suggestions: readonly SuggestedNodeDraft[],
  existingNodeTitles: readonly string[] | undefined,
): readonly SuggestedNodeDraft[] {
  if (!existingNodeTitles || existingNodeTitles.length === 0) {
    return suggestions;
  }

  const existing = new Set(existingNodeTitles.map(normalizeTitle));

  return suggestions.filter(
    (suggestion) => !existing.has(normalizeTitle(suggestion.title)),
  );
}

function formatExistingTitlesSection(titles: readonly string[]): string {
  if (titles.length === 0) {
    return "None.";
  }

  return titles.map((title, index) => `${index + 1}. ${title}`).join("\n");
}

export function buildNodeExtractorSystemPrompt(
  existingNodeTitles: readonly string[] = [],
): string {
  return [
    "You extract learning concepts as knowledge node suggestions from a Q&A exchange.",
    "Return ONLY valid JSON — a JSON array of objects.",
    'Each object must have: { "title": string, "description": string | null }',
    `Return at most ${NODE_EXTRACTOR_MAX_SUGGESTIONS} suggestions.`,
    "Suggest only concepts clearly discussed in the assistant answer.",
    "Do not suggest nodes that already exist in the user's library (listed below).",
    "Titles must be short, specific, and unique within your response.",
    "",
    "Existing node titles (do not suggest duplicates):",
    formatExistingTitlesSection(existingNodeTitles),
    "",
    'Example: [{"title":"Binary Search","description":"Search a sorted array by halving the interval."}]',
  ].join("\n");
}

export function buildNodeExtractorMessages(
  input: NodeExtractorInput,
): ChatMessage[] {
  return [
    {
      role: "system",
      content: buildNodeExtractorSystemPrompt(input.existingNodeTitles ?? []),
    },
    {
      role: "user",
      content: [
        "Extract knowledge node suggestions from this exchange.",
        "",
        `User question:\n${input.question}`,
        "",
        `Assistant answer:\n${input.answer}`,
      ].join("\n"),
    },
  ];
}

export class NodeExtractor {
  constructor(private readonly complete: CompleteFn = callOpenAI) {}

  async extract(input: NodeExtractorInput): Promise<NodeExtractorResult> {
    const llmResult = await this.complete(buildNodeExtractorMessages(input), {
      temperature: 0,
      maxTokens: 512,
    });

    const suggestions = filterExistingTitles(
      parseNodeExtractorLlmJson(llmResult.content),
      input.existingNodeTitles,
    );

    return { suggestions };
  }
}
