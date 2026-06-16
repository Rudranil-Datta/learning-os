import type { KnowledgeNodeResponse } from "@/types/api";

interface NodeCardProps {
  readonly node: KnowledgeNodeResponse;
}

export function NodeCard({ node }: NodeCardProps): React.JSX.Element {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {node.title}
      </h2>
      {node.description ? (
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {node.description}
        </p>
      ) : (
        <p className="mt-2 text-sm italic text-zinc-400 dark:text-zinc-500">
          No description
        </p>
      )}
    </article>
  );
}
