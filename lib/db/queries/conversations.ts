import type { Prisma, PrismaClient } from "@/app/generated/prisma/client";

const conversationSelect = {
  id: true,
  userId: true,
  contextNodeId: true,
  title: true,
  createdAt: true,
} as const;

type ConversationRow = Prisma.ConversationGetPayload<{
  select: typeof conversationSelect;
}>;

export interface ConversationRecord {
  readonly id: string;
  readonly userId: string;
  readonly contextNodeId: string | null;
  readonly title: string | null;
  readonly createdAt: Date;
}

export interface CreateConversationInput {
  readonly userId: string;
  readonly contextNodeId?: string | null;
  readonly title?: string | null;
}

function mapConversation(row: ConversationRow): ConversationRecord {
  return {
    id: row.id,
    userId: row.userId,
    contextNodeId: row.contextNodeId,
    title: row.title,
    createdAt: row.createdAt,
  };
}

export class ConversationRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(
    conversationId: string,
    userId: string,
  ): Promise<ConversationRecord | null> {
    const row = await this.db.conversation.findFirst({
      where: { id: conversationId, userId },
      select: conversationSelect,
    });

    if (!row) {
      return null;
    }

    return mapConversation(row);
  }

  async create(input: CreateConversationInput): Promise<ConversationRecord> {
    const row = await this.db.conversation.create({
      data: {
        userId: input.userId,
        contextNodeId: input.contextNodeId ?? null,
        title: input.title ?? null,
      },
      select: conversationSelect,
    });

    return mapConversation(row);
  }

  async getOrCreateMainConversation(
    userId: string,
    conversationId?: string,
  ): Promise<ConversationRecord> {
    if (conversationId) {
      const existing = await this.findById(conversationId, userId);
      if (existing && existing.contextNodeId === null) {
        return existing;
      }
    }

    return this.create({ userId, contextNodeId: null });
  }
}
