"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { ChatMessage } from "@/components/ChatMessage";
import { SuggestionChipList } from "@/components/SuggestionChip";
import {
  fetchChatHistory,
  isChatApiError,
  sendMessage,
} from "@/lib/api/chat-client";
import {
  confirmSuggestions,
  isSuggestionsApiError,
  rejectSuggestion,
} from "@/lib/api/suggestions-client";
import type { SuggestedNodeResponse } from "@/types/api";

interface DisplayMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly suggestions?: readonly SuggestedNodeResponse[];
}

interface ChatInterfaceProps {
  readonly conversationId: string;
  readonly conversationTitle: string;
  readonly onConversationActivity: () => void;
}

function createMessageId(): string {
  return crypto.randomUUID();
}

function toDisplayMessage(message: {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly suggestedNodes?: readonly SuggestedNodeResponse[];
}): DisplayMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    suggestions: message.suggestedNodes,
  };
}

export function ChatInterface({
  conversationId,
  conversationTitle,
  onConversationActivity,
}: ChatInterfaceProps): React.JSX.Element {
  const [messages, setMessages] = useState<readonly DisplayMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [pendingSuggestionId, setPendingSuggestionId] = useState<string | null>(
    null,
  );
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    async function loadHistory(): Promise<void> {
      setIsLoadingHistory(true);
      setError(null);
      setSuccessMessage(null);
      setDraft("");

      try {
        const history = await fetchChatHistory(conversationId);
        setMessages(history.messages.map(toDisplayMessage));
      } catch (loadError: unknown) {
        if (isChatApiError(loadError)) {
          setError(loadError.message);
        } else {
          setError("Could not load chat history. Try again.");
        }
        setMessages([]);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    void loadHistory();
  }, [conversationId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const message = draft.trim();
    if (message.length === 0 || isSending || isLoadingHistory) {
      return;
    }

    setError(null);
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
      const result = await sendMessage({
        message,
        conversationId,
      });

      const assistantMessage: DisplayMessage = {
        id: createMessageId(),
        role: "assistant",
        content: result.answer,
        suggestions: result.suggestedNodes,
      };

      setMessages((current) => [...current, assistantMessage]);
      onConversationActivity();
    } catch (submitError: unknown) {
      if (isChatApiError(submitError)) {
        setError(submitError.message);
      } else {
        setError("Could not send message. Try again.");
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

    setError(null);
    setSuccessMessage(null);
    setPendingSuggestionId(suggestionId);

    try {
      const result = await confirmSuggestions({ suggestionIds: [suggestionId] });
      removeSuggestionFromMessage(messageId, suggestionId);

      const savedNode = result.nodes[0];
      if (savedNode) {
        setSuccessMessage(`Saved "${savedNode.title}" to your nodes.`);
      }
    } catch (confirmError: unknown) {
      if (isSuggestionsApiError(confirmError)) {
        setError(confirmError.message);
      } else {
        setError("Could not confirm suggestion. Try again.");
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

    setError(null);
    setSuccessMessage(null);
    setPendingSuggestionId(suggestionId);

    try {
      await rejectSuggestion(suggestionId);
      removeSuggestionFromMessage(messageId, suggestionId);
    } catch (dismissError: unknown) {
      if (isSuggestionsApiError(dismissError)) {
        setError(dismissError.message);
      } else {
        setError("Could not dismiss suggestion. Try again.");
      }
    } finally {
      setPendingSuggestionId(null);
    }
  }

  return (
    <section className="flex h-full min-h-[32rem] w-full flex-col rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {conversationTitle}
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Ask anything. Suggested concepts appear after each answer.
        </p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {isLoadingHistory ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Loading conversation...
          </p>
        ) : null}

        {!isLoadingHistory && messages.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Start a conversation to build your knowledge base.
          </p>
        ) : null}

        {messages.map((message) => (
          <ChatMessage key={message.id} role={message.role} content={message.content}>
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

      {error ? (
        <p
          role="alert"
          className="mx-4 mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="border-t border-zinc-200 p-4 dark:border-zinc-800"
      >
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="chat-message">
            Message
          </label>
          <textarea
            id="chat-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={isSending || isLoadingHistory}
            rows={2}
            placeholder="Ask about a concept..."
            className="min-h-[2.75rem] flex-1 resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <button
            type="submit"
            disabled={isSending || isLoadingHistory || draft.trim().length === 0}
            className="self-end rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500"
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
}
