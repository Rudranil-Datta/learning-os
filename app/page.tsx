import Link from "next/link";

export default function Home(): React.JSX.Element {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-10">
      <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
        Learning OS
      </h1>
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Personal knowledge system. Chat, extract concepts, build your tree.
      </p>
      <Link
        href="/nodes"
        className="inline-flex w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Browse nodes
      </Link>
    </main>
  );
}
