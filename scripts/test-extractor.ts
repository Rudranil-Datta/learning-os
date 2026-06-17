import "dotenv/config";

import { NodeExtractor } from "../lib/agents/nodeExtractor";
import { isAppError } from "../lib/errors/app-error";
import { isLLMError } from "../lib/errors/llm-error";
import type { SuggestedNodeDraft } from "../types/database";

const SAMPLE_QUESTION = "What is binary search?";
const SAMPLE_ANSWER = [
  "Binary search finds a target in a sorted array by repeatedly halving the search interval.",
  "It uses the divide and conquer paradigm.",
  "Its time complexity is O(log n) because each step eliminates half the remaining elements.",
].join(" ");

function assertSuggestions(
  suggestions: readonly SuggestedNodeDraft[],
): void {
  for (const suggestion of suggestions) {
    if (!suggestion.title.trim()) {
      throw new Error("Extractor returned suggestion with empty title");
    }

    if (
      suggestion.description !== null &&
      typeof suggestion.description !== "string"
    ) {
      throw new Error("Extractor returned invalid description type");
    }
  }
}

function titlesMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

async function main(): Promise<void> {
  const extractor = new NodeExtractor();

  const result = await extractor.extract({
    question: SAMPLE_QUESTION,
    answer: SAMPLE_ANSWER,
  });

  assertSuggestions(result.suggestions);

  if (result.suggestions.length === 0) {
    throw new Error("Extractor returned no suggestions");
  }

  const blockedTitle = result.suggestions[0].title;

  const filtered = await extractor.extract({
    question: SAMPLE_QUESTION,
    answer: SAMPLE_ANSWER,
    existingNodeTitles: [blockedTitle],
  });

  assertSuggestions(filtered.suggestions);

  if (
    filtered.suggestions.some((suggestion) =>
      titlesMatch(suggestion.title, blockedTitle),
    )
  ) {
    throw new Error("Extractor did not filter existing node title");
  }

  console.log("OK: Node extractor successful");
  console.log(`Suggestions: ${result.suggestions.length}`);
  console.log(`Filtered duplicate "${blockedTitle}" — remaining: ${filtered.suggestions.length}`);

  for (const suggestion of result.suggestions) {
    console.log(`- ${suggestion.title}`);
  }
}

main().catch((error: unknown) => {
  console.error("Node extractor test failed");

  if (isLLMError(error) || isAppError(error)) {
    console.error(`${error.name}: ${error.message}`);
    if (error.details !== undefined) {
      console.error(error.details);
    }
  } else if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
});
