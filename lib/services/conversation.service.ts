import { DEFAULT_USER_ID } from "@/lib/constants/user";
import { ConversationRepository } from "@/lib/db/queries/conversations";
import { KnowledgeNodeRepository } from "@/lib/db/queries/nodes";
import { NotFoundError } from "@/lib/errors/app-error";

export const MAIN_CONVERSATION_LIST_LIMIT = 50;

export interface MainConversationSummary {
  readonly id: string;
  readonly title: string;
  readonly createdAt: Date;
  readonly updatedAt: string;
}

export interface SideConversationSummary {
  readonly id: string;
  readonly contextNodeId: string;
  readonly title: string;
  readonly createdAt: string;
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
    private readonly knowledgeNodeRepository: KnowledgeNodeRepository,
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

  async getOrCreateSideConversation(
    contextNodeId: string,
  ): Promise<SideConversationSummary> {
    const node = await this.knowledgeNodeRepository.findById(
      contextNodeId,
      this.userId,
    );

    if (node === null) {
      throw new NotFoundError("Knowledge node not found");
    }

    const conversation = await this.repository.getOrCreateSideConversation(
      contextNodeId,
      this.userId,
      node.title,
    );

    return {
      id: conversation.id,
      contextNodeId,
      title: node.title,
      createdAt: conversation.createdAt.toISOString(),
    };
  }
}

export function truncateMainConversationTitle(text: string): string {
  return truncateConversationTitle(text);
}
