"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ChatInterface } from "@/components/ChatInterface";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ContextualSidePanel } from "@/components/ContextualSidePanel";
import { KnowledgeTree } from "@/components/KnowledgeTree";
import {
  createConversation,
  getOrCreateSideConversation,
  isConversationsApiError,
  listConversations,
} from "@/lib/api/conversations-client";
import { MAIN_CONVERSATION_STORAGE_KEY } from "@/lib/constants/chat-storage";
import type { ConversationSummaryResponse } from "@/types/api";

function pickInitialConversationId(
  conversations: readonly ConversationSummaryResponse[],
): string | undefined {
  if (conversations.length === 0) {
    return undefined;
  }

  const storedId = window.localStorage.getItem(MAIN_CONVERSATION_STORAGE_KEY);
  if (storedId !== null && conversations.some((item) => item.id === storedId)) {
    return storedId;
  }

  return conversations[0]?.id;
}

export function ChatShell(): React.JSX.Element {
  const [conversations, setConversations] = useState<
    readonly ConversationSummaryResponse[]
  >([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(undefined);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [treeRefreshToken, setTreeRefreshToken] = useState(0);
  const [selectedNode, setSelectedNode] = useState<{
    readonly id: string;
    readonly title: string;
  } | null>(null);
  const [sideConversationId, setSideConversationId] = useState<string | null>(
    null,
  );
  const [isSideConversationLoading, setIsSideConversationLoading] =
    useState(false);
  const [sideConversationError, setSideConversationError] = useState<
    string | null
  >(null);

  const refreshConversations = useCallback(async (): Promise<
    readonly ConversationSummaryResponse[]
  > => {
    const nextConversations = await listConversations();
    setConversations(nextConversations);
    return nextConversations;
  }, []);

  useEffect(() => {
    async function bootstrap(): Promise<void> {
      setIsBootstrapping(true);
      setError(null);

      try {
        let nextConversations = await refreshConversations();

        if (nextConversations.length === 0) {
          const created = await createConversation();
          nextConversations = [created];
          setConversations(nextConversations);
        }

        const initialId = pickInitialConversationId(nextConversations);
        setSelectedConversationId(initialId);

        if (initialId !== undefined) {
          window.localStorage.setItem(
            MAIN_CONVERSATION_STORAGE_KEY,
            initialId,
          );
        }
      } catch (bootstrapError: unknown) {
        if (isConversationsApiError(bootstrapError)) {
          setError(bootstrapError.message);
        } else {
          setError("Could not load chats. Try again.");
        }
      } finally {
        setIsBootstrapping(false);
      }
    }

    void bootstrap();
  }, [refreshConversations]);

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === selectedConversationId,
      ),
    [conversations, selectedConversationId],
  );

  function handleSelectConversation(conversationId: string): void {
    setSelectedConversationId(conversationId);
    window.localStorage.setItem(
      MAIN_CONVERSATION_STORAGE_KEY,
      conversationId,
    );
  }

  async function handleNewChat(): Promise<void> {
    setIsCreating(true);
    setError(null);

    try {
      const created = await createConversation();
      setConversations((current) => [created, ...current]);
      handleSelectConversation(created.id);
    } catch (createError: unknown) {
      if (isConversationsApiError(createError)) {
        setError(createError.message);
      } else {
        setError("Could not create a new chat. Try again.");
      }
    } finally {
      setIsCreating(false);
    }
  }

  async function handleConversationActivity(): Promise<void> {
    try {
      const nextConversations = await refreshConversations();
      if (
        selectedConversationId !== undefined &&
        !nextConversations.some((item) => item.id === selectedConversationId)
      ) {
        const fallbackId = nextConversations[0]?.id;
        if (fallbackId !== undefined) {
          handleSelectConversation(fallbackId);
        }
      }
    } catch {
      // Sidebar refresh is best-effort after chat activity.
    }
  }

  async function handleNodeSelect(nodeId: string, title: string): Promise<void> {
    setSelectedNode({ id: nodeId, title });
    setSideConversationId(null);
    setSideConversationError(null);
    setIsSideConversationLoading(true);

    try {
      const conversation = await getOrCreateSideConversation({
        contextNodeId: nodeId,
      });
      setSideConversationId(conversation.id);
    } catch (sideError: unknown) {
      if (isConversationsApiError(sideError)) {
        setSideConversationError(sideError.message);
      } else {
        setSideConversationError("Could not open node session. Try again.");
      }
    } finally {
      setIsSideConversationLoading(false);
    }
  }

  function handleCloseSidePanel(): void {
    setSelectedNode(null);
    setSideConversationId(null);
    setSideConversationError(null);
    setIsSideConversationLoading(false);
  }

  if (isBootstrapping) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading chats...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[calc(100dvh-4.5rem)] w-full">
      <ChatSidebar
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        isCreating={isCreating}
        onSelectConversation={handleSelectConversation}
        onNewChat={() => {
          void handleNewChat();
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col xl:flex-row">
        <div className="flex min-h-0 flex-1 flex-col border-r border-zinc-200 dark:border-zinc-800">
          <div className="border-b border-zinc-200 p-3 md:hidden dark:border-zinc-800">
            <div className="flex gap-2">
              <select
                value={selectedConversationId ?? ""}
                onChange={(event) => handleSelectConversation(event.target.value)}
                className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                {conversations.map((conversation) => (
                  <option key={conversation.id} value={conversation.id}>
                    {conversation.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  void handleNewChat();
                }}
                disabled={isCreating}
                className="shrink-0 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-indigo-500"
              >
                New
              </button>
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="mx-4 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
            >
              {error}
            </p>
          ) : null}

          {selectedConversationId !== undefined ? (
            <div className="flex min-h-0 flex-1 p-4">
              <ChatInterface
                conversationId={selectedConversationId}
                conversationTitle={selectedConversation?.title ?? "Chat"}
                onConversationActivity={() => {
                  void handleConversationActivity();
                }}
                onNodeConfirmed={() => {
                  setTreeRefreshToken((current) => current + 1);
                }}
              />
            </div>
          ) : null}
        </div>

        <aside className="hidden min-h-0 w-80 shrink-0 flex-col gap-4 p-4 xl:flex">
          <section
            className={`flex min-h-0 flex-col rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 ${
              selectedNode ? "max-h-[45%]" : "flex-1"
            }`}
          >
            <header className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Knowledge tree
              </h2>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <KnowledgeTree
                refreshToken={treeRefreshToken}
                selectedNodeId={selectedNode?.id}
                onNodeSelect={(nodeId, title) => {
                  void handleNodeSelect(nodeId, title);
                }}
              />
            </div>
          </section>

          {selectedNode ? (
            <ContextualSidePanel
              nodeId={selectedNode.id}
              conversationId={sideConversationId}
              isConversationLoading={isSideConversationLoading}
              conversationError={sideConversationError}
              onClose={handleCloseSidePanel}
              onNodeConfirmed={() => {
                setTreeRefreshToken((current) => current + 1);
              }}
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}
