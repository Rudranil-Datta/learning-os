"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { ChatMessage } from "@/components/ChatMessage";
import { SuggestionChipList } from "@/components/SuggestionChip";
import { isChatApiError, sendMessage } from "@/lib/api/chat-client";
import type { SuggestedNodeResponse } from "@/types/api";

interface DisplayMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly suggestions?: readonly SuggestedNodeResponse[];
}

function createMessageId(): string {
  return crypto.randomUUID();
}

export function ChatInterface(): React.JSX.Element {
  const [messages, setMessages] = useState<readonly DisplayMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(
    undefined,
  );
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const message = draft.trim();
    if (message.length === 0 || isSending) {
      return;
    }

    setError(null);
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

      if (result.conversationId) {
        setConversationId(result.conversationId);
      }

      const assistantMessage: DisplayMessage = {
        id: createMessageId(),
        role: "assistant",
        content: result.answer,
        suggestions: result.suggestedNodes,
      };

      setMessages((current) => [...current, assistantMessage]);
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

  return (
    <section className="flex h-full min-h-[32rem] flex-col rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Main chat
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Ask anything. Suggested concepts appear after each answer.
        </p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Start a conversation to build your knowledge base.
          </p>
        ) : null}

        {messages.map((message) => (
          <ChatMessage key={message.id} role={message.role} content={message.content}>
            {message.role === "assistant" && message.suggestions ? (
              <SuggestionChipList suggestions={message.suggestions} />
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
            disabled={isSending}
            rows={2}
            placeholder="Ask about a concept..."
            className="min-h-[2.75rem] flex-1 resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <button
            type="submit"
            disabled={isSending || draft.trim().length === 0}
            className="self-end rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500"
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
}
