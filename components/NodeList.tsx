"use client";

import { useCallback, useEffect, useState } from "react";

import { listNodes, isNodesApiError } from "@/lib/api/nodes-client";
import type { KnowledgeNodeResponse } from "@/types/api";

import { NodeCard } from "@/components/NodeCard";

interface NodeListProps {
  readonly refreshToken?: number;
  readonly searchQuery?: string;
}

export function NodeList({
  refreshToken = 0,
  searchQuery,
}: NodeListProps): React.JSX.Element {
  const [nodes, setNodes] = useState<readonly KnowledgeNodeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNodes = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await listNodes(searchQuery);
      setNodes(data);
    } catch (loadError: unknown) {
      if (isNodesApiError(loadError)) {
        setError(loadError.message);
      } else {
        setError("Could not load nodes. Try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    void loadNodes();
  }, [loadNodes, refreshToken, searchQuery]);

  if (isLoading) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading nodes...</p>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
        <button
          type="button"
          onClick={() => {
            void loadNodes();
          }}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
        >
          Retry
        </button>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        {searchQuery
          ? "No nodes match your search."
          : "No nodes yet. Create your first one above."}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {nodes.map((node) => (
        <li key={node.id}>
          <NodeCard node={node} />
        </li>
      ))}
    </ul>
  );
}
