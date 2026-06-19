import type { SuggestedNodeResponse } from "@/types/api";

interface SuggestionChipProps {
  readonly suggestion: SuggestedNodeResponse;
}

export function SuggestionChip({
  suggestion,
}: SuggestionChipProps): React.JSX.Element {
  return (
    <span
      data-suggestion-id={suggestion.id}
      title={suggestion.description ?? undefined}
      className="inline-flex max-w-full flex-col rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-left dark:border-indigo-900 dark:bg-indigo-950/50"
    >
      <span className="truncate text-sm font-medium text-indigo-900 dark:text-indigo-100">
        {suggestion.title}
      </span>
      {suggestion.description ? (
        <span className="truncate text-xs text-indigo-700 dark:text-indigo-300">
          {suggestion.description}
        </span>
      ) : null}
    </span>
  );
}

interface SuggestionChipListProps {
  readonly suggestions: readonly SuggestedNodeResponse[];
}

export function SuggestionChipList({
  suggestions,
}: SuggestionChipListProps): React.JSX.Element | null {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Suggested concepts
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <SuggestionChip key={suggestion.id} suggestion={suggestion} />
        ))}
      </div>
    </div>
  );
}
