import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <nav className="mx-auto flex w-full max-w-3xl items-center gap-6 px-6 py-4">
          <Link
            href="/"
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Learning OS
          </Link>
          <Link
            href="/nodes"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Nodes
          </Link>
        </nav>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
