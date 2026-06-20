"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { ChatMessage } from "@/components/ChatMessage";
import { SuggestionChipList } from "@/components/SuggestionChip";
import { getNodeById, isNodesApiError } from "@/lib/api/nodes-client";
import {
  isSideChatApiError,
  sendSideMessage,
} from "@/lib/api/sidechat-client";
import {
  confirmSuggestions,
  isSuggestionsApiError,
  rejectSuggestion,
} from "@/lib/api/suggestions-client";
import type {
  KnowledgeNodeDetailResponse,
  SuggestedNodeResponse,
} from "@/types/api";

interface DisplayMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly suggestions?: readonly SuggestedNodeResponse[];
}

interface ContextualSidePanelProps {
  readonly nodeId: string;
  readonly conversationId: string | null;
  readonly isConversationLoading: boolean;
  readonly conversationError: string | null;
  readonly onClose: () => void;
  readonly onNodeConfirmed?: () => void;
}

function createMessageId(): string {
  return crypto.randomUUID();
}

export function ContextualSidePanel({
  nodeId,
  conversationId,
  isConversationLoading,
  conversationError,
  onClose,
  onNodeConfirmed,
}: ContextualSidePanelProps): React.JSX.Element {
  const [node, setNode] = useState<KnowledgeNodeDetailResponse | null>(null);
  const [isNodeLoading, setIsNodeLoading] = useState(true);
  const [nodeError, setNodeError] = useState<string | null>(null);
  const [messages, setMessages] = useState<readonly DisplayMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [pendingSuggestionId, setPendingSuggestionId] = useState<string | null>(
    null,
  );
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  const loadNode = useCallback(async (): Promise<void> => {
    setIsNodeLoading(true);
    setNodeError(null);

    try {
      const data = await getNodeById(nodeId);
      setNode(data);
    } catch (loadError: unknown) {
      if (isNodesApiError(loadError)) {
        setNodeError(loadError.message);
      } else {
        setNodeError("Could not load node details. Try again.");
      }
    } finally {
      setIsNodeLoading(false);
    }
  }, [nodeId]);

  useEffect(() => {
    void loadNode();
  }, [loadNode]);

  useEffect(() => {
    setMessages([]);
    setDraft("");
    setChatError(null);
    setSuccessMessage(null);
  }, [nodeId, conversationId]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    if (successMessage === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [successMessage]);

  const isLoading = isNodeLoading || isConversationLoading;
  const bootstrapError = nodeError ?? conversationError;
  const canSend =
    conversationId !== null && !isLoading && !bootstrapError && !isSending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const message = draft.trim();
    if (!canSend || message.length === 0) {
      return;
    }

    setChatError(null);
    setSuccessMessage(null);
    setIsSending(true);
    setDraft("");

    const userMessage: DisplayMessage = {
      id: createMessageId(),
      role: "user",
      content: message,
    };

    setMessages((current) => [...current, userMessage]);

    try {
      const result = await sendSideMessage({
        message,
        conversationId,
        contextNodeId: nodeId,
      });

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: result.answer,
          suggestions: result.suggestedNodes,
        },
      ]);
    } catch (submitError: unknown) {
      if (isSideChatApiError(submitError)) {
        setChatError(submitError.message);
      } else {
        setChatError("Could not send message. Try again.");
      }
    } finally {
      setIsSending(false);
    }
  }

  function removeSuggestionFromMessage(
    messageId: string,
    suggestionId: string,
  ): void {
    setMessages((current) =>
      current.map((message) => {
        if (message.id !== messageId || !message.suggestions) {
          return message;
        }

        const suggestions = message.suggestions.filter(
          (suggestion) => suggestion.id !== suggestionId,
        );

        return {
          ...message,
          suggestions: suggestions.length > 0 ? suggestions : undefined,
        };
      }),
    );
  }

  async function handleConfirmSuggestion(
    messageId: string,
    suggestionId: string,
  ): Promise<void> {
    if (pendingSuggestionId !== null) {
      return;
    }

    setChatError(null);
    setSuccessMessage(null);
    setPendingSuggestionId(suggestionId);

    try {
      const result = await confirmSuggestions({
        suggestionIds: [suggestionId],
        contextNodeId: nodeId,
      });
      removeSuggestionFromMessage(messageId, suggestionId);

      const savedNode = result.nodes[0];
      if (savedNode) {
        setSuccessMessage(`Saved "${savedNode.title}" and linked to this node.`);
        onNodeConfirmed?.();
      }
    } catch (confirmError: unknown) {
      if (isSuggestionsApiError(confirmError)) {
        setChatError(confirmError.message);
      } else {
        setChatError("Could not confirm suggestion. Try again.");
      }
    } finally {
      setPendingSuggestionId(null);
    }
  }

  async function handleDismissSuggestion(
    messageId: string,
    suggestionId: string,
  ): Promise<void> {
    if (pendingSuggestionId !== null) {
      return;
    }

    setChatError(null);
    setSuccessMessage(null);
    setPendingSuggestionId(suggestionId);

    try {
      await rejectSuggestion(suggestionId);
      removeSuggestionFromMessage(messageId, suggestionId);
    } catch (dismissError: unknown) {
      if (isSuggestionsApiError(dismissError)) {
        setChatError(dismissError.message);
      } else {
        setChatError("Could not dismiss suggestion. Try again.");
      }
    } finally {
      setPendingSuggestionId(null);
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex items-start justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Discussing
          </p>
          <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {node?.title ?? "Loading..."}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close side panel"
          className="shrink-0 rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          ✕
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {isLoading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Opening node session...
          </p>
        ) : null}

        {bootstrapError ? (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {bootstrapError}
          </p>
        ) : null}

        {!isLoading && !bootstrapError && node ? (
          <>
            {node.explanation || node.description ? (
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {node.explanation ?? node.description}
              </p>
            ) : (
              <p className="text-sm italic text-zinc-400 dark:text-zinc-500">
                No explanation yet for this node.
              </p>
            )}

            {messages.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Ask a question about this concept.
              </p>
            ) : null}

            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
              >
                {message.role === "assistant" && message.suggestions ? (
                  <SuggestionChipList
                    suggestions={message.suggestions}
                    pendingSuggestionId={pendingSuggestionId}
                    onConfirm={(suggestionId) =>
                      handleConfirmSuggestion(message.id, suggestionId)
                    }
                    onDismiss={(suggestionId) =>
                      handleDismissSuggestion(message.id, suggestionId)
                    }
                  />
                ) : null}
              </ChatMessage>
            ))}

            {isSending ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  Thinking...
                </div>
              </div>
            ) : null}

            <div ref={scrollAnchorRef} />
          </>
        ) : null}
      </div>

      {successMessage ? (
        <p className="mx-4 mb-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          {successMessage}{" "}
          <Link
            href="/nodes"
            className="font-medium underline underline-offset-2"
          >
            View nodes
          </Link>
        </p>
      ) : null}

      {chatError ? (
        <p
          role="alert"
          className="mx-4 mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {chatError}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="border-t border-zinc-200 p-4 dark:border-zinc-800"
      >
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="side-panel-message">
            Message
          </label>
          <input
            id="side-panel-message"
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={!canSend}
            placeholder={
              conversationId
                ? "Ask about this node..."
                : "Waiting for session..."
            }
            className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:disabled:bg-zinc-950"
          />
          <button
            type="submit"
            disabled={!canSend || draft.trim().length === 0}
            className="shrink-0 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500"
          >
            {isSending ? "..." : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
}
