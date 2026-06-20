"use client";

import Link from "next/link";
import { useState } from "react";

import { KnowledgeTree } from "@/components/KnowledgeTree";

export default function KnowledgeTreePage(): React.JSX.Element {
  const [selectedNode, setSelectedNode] = useState<{
    readonly id: string;
    readonly title: string;
  } | null>(null);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Knowledge Tree
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Parent–child hierarchy of your concepts. Link nodes as parent/child on
          the{" "}
          <Link
            href="/nodes"
            className="font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
          >
            Nodes
          </Link>{" "}
          page to build structure.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="p-4">
          <KnowledgeTree
            onNodeSelect={(nodeId, title) => {
              setSelectedNode({ id: nodeId, title });
            }}
          />
        </div>
        {selectedNode ? (
          <footer className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Selected
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {selectedNode.title}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Side-panel chat arrives Day 17.
            </p>
          </footer>
        ) : null}
      </section>
    </main>
  );
}
