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

  async findLatestMainConversation(
    userId: string,
  ): Promise<ConversationRecord | null> {
    const row = await this.db.conversation.findFirst({
      where: {
        userId,
        contextNodeId: null,
      },
      orderBy: { createdAt: "desc" },
      select: conversationSelect,
    });

    if (!row) {
      return null;
    }

    return mapConversation(row);
  }

  async updateTitle(
    conversationId: string,
    title: string,
    userId: string,
  ): Promise<void> {
    await this.db.conversation.updateMany({
      where: {
        id: conversationId,
        userId,
      },
      data: { title },
    });
  }

  async listMainConversations(
    userId: string,
    limit: number,
  ): Promise<
    readonly {
      id: string;
      title: string | null;
      createdAt: Date;
      lastMessageAt: Date | null;
      lastMessagePreview: string | null;
    }[]
  > {
    const rows = await this.db.conversation.findMany({
      where: {
        userId,
        contextNodeId: null,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        messages: {
          select: {
            content: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return rows
      .map((row) => ({
        id: row.id,
        title: row.title,
        createdAt: row.createdAt,
        lastMessageAt: row.messages[0]?.createdAt ?? null,
        lastMessagePreview: row.messages[0]?.content ?? null,
      }))
      .sort((left, right) => {
        const leftTime = (left.lastMessageAt ?? left.createdAt).getTime();
        const rightTime = (right.lastMessageAt ?? right.createdAt).getTime();
        return rightTime - leftTime;
      })
      .slice(0, limit);
  }
}
