import { ChatInterface } from "@/components/ChatInterface";
import { SidePanelPlaceholder } from "@/components/SidePanelPlaceholder";

export default function DashboardPage(): React.JSX.Element {
  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 p-6 lg:grid-cols-3">
      <div className="min-h-0 lg:col-span-2">
        <ChatInterface />
      </div>
      <aside className="hidden min-h-0 lg:col-span-1 lg:block">
        <SidePanelPlaceholder />
      </aside>
    </main>
  );
}
