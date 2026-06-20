import { DEFAULT_USER_ID } from "@/lib/constants/user";
import { ConversationRepository } from "@/lib/db/queries/conversations";

export const MAIN_CONVERSATION_LIST_LIMIT = 50;

export interface MainConversationSummary {
  readonly id: string;
  readonly title: string;
  readonly createdAt: Date;
  readonly updatedAt: string;
}

function truncateConversationTitle(text: string, maxLength = 64): string {
  const normalized = text.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
}

function toDisplayTitle(
  title: string | null,
  lastMessagePreview: string | null,
  createdAt: Date,
): string {
  if (title !== null && title.trim().length > 0) {
    return title.trim();
  }

  if (lastMessagePreview !== null && lastMessagePreview.trim().length > 0) {
    return truncateConversationTitle(lastMessagePreview);
  }

  return `Chat ${createdAt.toLocaleDateString()}`;
}

export class ConversationService {
  constructor(
    private readonly repository: ConversationRepository,
    private readonly userId: string = DEFAULT_USER_ID,
  ) {}

  async listMainConversations(): Promise<readonly MainConversationSummary[]> {
    const rows = await this.repository.listMainConversations(
      this.userId,
      MAIN_CONVERSATION_LIST_LIMIT,
    );

    return rows.map((row) => ({
      id: row.id,
      title: toDisplayTitle(row.title, row.lastMessagePreview, row.createdAt),
      createdAt: row.createdAt,
      updatedAt: (row.lastMessageAt ?? row.createdAt).toISOString(),
    }));
  }

  async createMainConversation(): Promise<MainConversationSummary> {
    const conversation = await this.repository.create({
      userId: this.userId,
      contextNodeId: null,
    });

    return {
      id: conversation.id,
      title: "New chat",
      createdAt: conversation.createdAt,
      updatedAt: conversation.createdAt.toISOString(),
    };
  }
}

export function truncateMainConversationTitle(text: string): string {
  return truncateConversationTitle(text);
}
