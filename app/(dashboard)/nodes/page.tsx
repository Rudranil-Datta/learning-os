"use client";

import { useState } from "react";

import { CreateNodeForm } from "@/components/CreateNodeForm";
import { NodeList } from "@/components/NodeList";
import { NodeSearch } from "@/components/NodeSearch";

export default function NodesPage(): React.JSX.Element {
  const [refreshToken, setRefreshToken] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);

  function handleNodeCreated(): void {
    setRefreshToken((current) => current + 1);
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Knowledge Nodes
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create and browse your learning concepts.
        </p>
      </header>

      <CreateNodeForm onCreated={handleNodeCreated} />

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Your nodes
        </h2>
        <NodeSearch onSearchChange={setSearchQuery} />
        <NodeList refreshToken={refreshToken} searchQuery={searchQuery} />
      </section>
    </main>
  );
}
