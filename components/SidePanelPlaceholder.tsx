export function SidePanelPlaceholder(): React.JSX.Element {
  return (
    <section className="flex h-full min-h-[32rem] flex-col rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Node explorer
        </h2>
      </header>
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="max-w-xs text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Select a node to start exploring. Side-panel chat arrives Week 3.
        </p>
      </div>
    </section>
  );
}
