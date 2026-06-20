"use client";

import { useCallback, useEffect, useState } from "react";

import { getKnowledgeTree, isNodesApiError } from "@/lib/api/nodes-client";
import type { KnowledgeTreeNode } from "@/types/api";

interface KnowledgeTreeProps {
  readonly refreshToken?: number;
  readonly selectedNodeId?: string;
  readonly onNodeSelect?: (nodeId: string, title: string) => void;
}

interface KnowledgeTreeNodeItemProps {
  readonly node: KnowledgeTreeNode;
  readonly depth: number;
  readonly expandedIds: ReadonlySet<string>;
  readonly selectedNodeId?: string;
  readonly onToggleExpand: (nodeId: string) => void;
  readonly onNodeSelect?: (nodeId: string, title: string) => void;
}

function KnowledgeTreeNodeItem({
  node,
  depth,
  expandedIds,
  selectedNodeId,
  onToggleExpand,
  onNodeSelect,
}: KnowledgeTreeNodeItemProps): React.JSX.Element {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedNodeId === node.id;

  return (
    <li>
      <div
        className="flex items-center gap-1 py-0.5"
        style={{ paddingLeft: `${depth * 0.75}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse" : "Expand"}
            onClick={() => onToggleExpand(node.id)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            {isExpanded ? "▼" : "▶"}
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" aria-hidden="true" />
        )}

        <button
          type="button"
          onClick={() => onNodeSelect?.(node.id, node.title)}
          className={`min-w-0 flex-1 truncate rounded px-1 text-left text-sm hover:text-indigo-700 dark:hover:text-indigo-300 ${
            isSelected
              ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
              : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          }`}
        >
          {node.title}
        </button>

        {hasChildren ? (
          <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {node.children.length}
          </span>
        ) : null}
      </div>

      {hasChildren && isExpanded ? (
        <ul>
          {node.children.map((child) => (
            <KnowledgeTreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              selectedNodeId={selectedNodeId}
              onToggleExpand={onToggleExpand}
              onNodeSelect={onNodeSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function collectRootIds(tree: readonly KnowledgeTreeNode[]): Set<string> {
  return new Set(tree.map((node) => node.id));
}

export function KnowledgeTree({
  refreshToken = 0,
  selectedNodeId,
  onNodeSelect,
}: KnowledgeTreeProps): React.JSX.Element {
  const [tree, setTree] = useState<readonly KnowledgeTreeNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTree = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getKnowledgeTree();
      setTree(data);
      setExpandedIds(collectRootIds(data));
    } catch (loadError: unknown) {
      if (isNodesApiError(loadError)) {
        setError(loadError.message);
      } else {
        setError("Could not load knowledge tree. Try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTree();
  }, [loadTree, refreshToken]);

  function handleToggleExpand(nodeId: string): void {
    setExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }

      return next;
    });
  }

  if (isLoading) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Loading tree...
      </p>
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
            void loadTree();
          }}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
        No nodes yet. Confirm suggestions in chat or create nodes on the Nodes
        page.
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {tree.map((node) => (
        <KnowledgeTreeNodeItem
          key={node.id}
          node={node}
          depth={0}
          expandedIds={expandedIds}
          selectedNodeId={selectedNodeId}
          onToggleExpand={handleToggleExpand}
          onNodeSelect={onNodeSelect}
        />
      ))}
    </ul>
  );
}
