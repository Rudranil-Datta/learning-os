import type { SuggestedNodeResponse } from "@/types/api";

interface SuggestionChipProps {
  readonly suggestion: SuggestedNodeResponse;
  readonly onConfirm: (suggestionId: string) => void;
  readonly onDismiss: (suggestionId: string) => void;
  readonly isPending: boolean;
}

export function SuggestionChip({
  suggestion,
  onConfirm,
  onDismiss,
  isPending,
}: SuggestionChipProps): React.JSX.Element {
  return (
    <span
      data-suggestion-id={suggestion.id}
      title={suggestion.description ?? undefined}
      className="inline-flex max-w-full items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 py-1 pr-1 pl-2 text-left dark:border-indigo-900 dark:bg-indigo-950/50"
    >
      <button
        type="button"
        disabled={isPending}
        onClick={() => onConfirm(suggestion.id)}
        aria-label={`Confirm ${suggestion.title}`}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500"
      >
        {isPending ? "…" : "✓"}
      </button>
      <span className="min-w-0 flex-1 px-1">
        <span className="block truncate text-sm font-medium text-indigo-900 dark:text-indigo-100">
          {suggestion.title}
        </span>
        {suggestion.description ? (
          <span className="block truncate text-xs text-indigo-700 dark:text-indigo-300">
            {suggestion.description}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        disabled={isPending}
        onClick={() => onDismiss(suggestion.id)}
        aria-label={`Dismiss ${suggestion.title}`}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500"
      >
        ✕
      </button>
    </span>
  );
}

interface SuggestionChipListProps {
  readonly suggestions: readonly SuggestedNodeResponse[];
  readonly onConfirm: (suggestionId: string) => void;
  readonly onDismiss: (suggestionId: string) => void;
  readonly pendingSuggestionId: string | null;
}

export function SuggestionChipList({
  suggestions,
  onConfirm,
  onDismiss,
  pendingSuggestionId,
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
          <SuggestionChip
            key={suggestion.id}
            suggestion={suggestion}
            onConfirm={onConfirm}
            onDismiss={onDismiss}
            isPending={pendingSuggestionId === suggestion.id}
          />
        ))}
      </div>
    </div>
  );
}
