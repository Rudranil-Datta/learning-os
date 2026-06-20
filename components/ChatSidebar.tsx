"use client";

import type { ConversationSummaryResponse } from "@/types/api";

interface ChatSidebarProps {
  readonly conversations: readonly ConversationSummaryResponse[];
  readonly selectedConversationId: string | undefined;
  readonly isCreating: boolean;
  readonly onSelectConversation: (conversationId: string) => void;
  readonly onNewChat: () => void;
}

export function ChatSidebar({
  conversations,
  selectedConversationId,
  isCreating,
  onSelectConversation,
  onNewChat,
}: ChatSidebarProps): React.JSX.Element {
  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 md:flex">
      <div className="border-b border-zinc-200 p-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={onNewChat}
          disabled={isCreating}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        >
          {isCreating ? "Creating..." : "New chat"}
        </button>
      </div>

      <nav
        aria-label="Chat history"
        className="flex-1 overflow-y-auto p-2"
      >
        {conversations.length === 0 ? (
          <p className="px-2 py-3 text-xs text-zinc-500 dark:text-zinc-400">
            No chats yet.
          </p>
        ) : null}

        <ul className="space-y-1">
          {conversations.map((conversation) => {
            const isSelected = conversation.id === selectedConversationId;

            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-indigo-100 text-indigo-950 dark:bg-indigo-950 dark:text-indigo-50"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="line-clamp-2">{conversation.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
