interface ChatMessageProps {
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly children?: React.ReactNode;
}

export function ChatMessage({
  role,
  content,
  children,
}: ChatMessageProps): React.JSX.Element {
  const isUser = role === "user";

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] space-y-3 ${isUser ? "items-end" : "items-start"}`}
      >
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap ${
            isUser
              ? "bg-indigo-100 text-indigo-950 dark:bg-indigo-950 dark:text-indigo-50"
              : "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
          }`}
        >
          {content}
        </div>
        {children}
      </div>
    </div>
  );
}
