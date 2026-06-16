"use client";

import { useEffect, useState } from "react";

interface NodeSearchProps {
  readonly onSearchChange: (query: string | undefined) => void;
}

const DEBOUNCE_MS = 300;

export function NodeSearch({
  onSearchChange,
}: NodeSearchProps): React.JSX.Element {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const trimmed = value.trim();

      onSearchChange(trimmed.length === 0 ? undefined : trimmed);
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, onSearchChange]);

  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Search nodes
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search title or description"
        className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
    </label>
  );
}
