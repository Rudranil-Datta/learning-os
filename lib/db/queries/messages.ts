import type { Prisma, PrismaClient } from "@/app/generated/prisma/client";

import type { ChatMessageRole } from "@/types/llm";

const messageSelect = {
  id: true,
  conversationId: true,
  role: true,
  content: true,
  createdAt: true,
} as const;

type MessageRow = Prisma.MessageGetPayload<{
  select: typeof messageSelect;
}>;

type DbExecutor = PrismaClient | Prisma.TransactionClient;

export interface MessageRecord {
  readonly id: string;
  readonly conversationId: string;
  readonly role: ChatMessageRole;
  readonly content: string;
  readonly createdAt: Date;
}

function toChatRole(role: "user" | "assistant"): ChatMessageRole {
  return role;
}

function mapMessage(
  row: MessageRow,
  fallbackConversationId?: string,
): MessageRecord | null {
  const conversationId = row.conversationId ?? fallbackConversationId;
  if (!conversationId) {
    return null;
  }

  return {
    id: row.id,
    conversationId,
    role: toChatRole(row.role),
    content: row.content,
    createdAt: row.createdAt,
  };
}

export class MessageRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(
    params: {
      readonly conversationId: string;
      readonly role: "user" | "assistant";
      readonly content: string;
    },
    db: DbExecutor = this.db,
  ): Promise<MessageRecord> {
    const row = await db.message.create({
      data: {
        conversationId: params.conversationId,
        role: params.role,
        content: params.content,
      },
      select: messageSelect,
    });

    const mapped = mapMessage(row, params.conversationId);
    if (mapped) {
      return mapped;
    }

    return {
      id: row.id,
      conversationId: params.conversationId,
      role: toChatRole(row.role),
      content: row.content,
      createdAt: row.createdAt,
    };
  }

  async listRecentByConversation(
    conversationId: string,
    limit: number,
  ): Promise<readonly MessageRecord[]> {
    const rows = await this.db.message.findMany({
      where: { conversationId },
      select: messageSelect,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return rows
      .map((row) => mapMessage(row))
      .filter((message): message is MessageRecord => message !== null)
      .reverse();
  }

  async listByConversation(
    conversationId: string,
    limit: number,
  ): Promise<readonly MessageRecord[]> {
    const rows = await this.db.message.findMany({
      where: { conversationId },
      select: messageSelect,
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    return rows
      .map((row) => mapMessage(row))
      .filter((message): message is MessageRecord => message !== null);
  }
}
