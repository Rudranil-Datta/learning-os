import type { Prisma, PrismaClient } from "@/app/generated/prisma/client";

import {
  DEFAULT_SUGGESTION_STATUS,
  SUGGESTION_STATUS,
  type CreatePendingNodeSuggestionInput,
  type PendingNodeSuggestionRecord,
  type SuggestionStatus,
} from "@/types/database";

const suggestionSelect = {
  id: true,
  userId: true,
  conversationId: true,
  title: true,
  description: true,
  status: true,
  createdAt: true,
} as const;

type SuggestionRow = Prisma.PendingNodeSuggestionGetPayload<{
  select: typeof suggestionSelect;
}>;

type DbExecutor = PrismaClient | Prisma.TransactionClient;

function toSuggestionStatus(
  status: "pending" | "confirmed" | "rejected",
): SuggestionStatus {
  return status;
}

function mapSuggestion(row: SuggestionRow): PendingNodeSuggestionRecord {
  return {
    id: row.id,
    userId: row.userId,
    conversationId: row.conversationId,
    title: row.title,
    description: row.description,
    status: toSuggestionStatus(row.status),
    createdAt: row.createdAt,
  };
}

export class SuggestionRepository {
  constructor(private readonly db: PrismaClient) {}

  async createMany(
    inputs: readonly CreatePendingNodeSuggestionInput[],
    db: DbExecutor = this.db,
  ): Promise<readonly PendingNodeSuggestionRecord[]> {
    if (inputs.length === 0) {
      return [];
    }

    const rows = await db.pendingNodeSuggestion.createManyAndReturn({
      data: inputs.map((input) => ({
        userId: input.userId,
        conversationId: input.conversationId,
        title: input.title,
        description: input.description ?? null,
        status: input.status ?? DEFAULT_SUGGESTION_STATUS,
      })),
      select: suggestionSelect,
    });

    return rows.map(mapSuggestion);
  }

  async findPendingById(
    suggestionId: string,
    userId: string,
    db: DbExecutor = this.db,
  ): Promise<PendingNodeSuggestionRecord | null> {
    const row = await db.pendingNodeSuggestion.findFirst({
      where: {
        id: suggestionId,
        userId,
        status: SUGGESTION_STATUS.pending,
      },
      select: suggestionSelect,
    });

    if (!row) {
      return null;
    }

    return mapSuggestion(row);
  }

  async findPendingByIds(
    suggestionIds: readonly string[],
    userId: string,
    db: DbExecutor = this.db,
  ): Promise<readonly PendingNodeSuggestionRecord[]> {
    if (suggestionIds.length === 0) {
      return [];
    }

    const rows = await db.pendingNodeSuggestion.findMany({
      where: {
        id: { in: [...suggestionIds] },
        userId,
        status: SUGGESTION_STATUS.pending,
      },
      select: suggestionSelect,
    });

    return rows.map(mapSuggestion);
  }

  async deleteById(
    suggestionId: string,
    userId: string,
    db: DbExecutor = this.db,
  ): Promise<boolean> {
    const result = await db.pendingNodeSuggestion.deleteMany({
      where: {
        id: suggestionId,
        userId,
      },
    });

    return result.count > 0;
  }

  async deleteManyByIds(
    suggestionIds: readonly string[],
    userId: string,
    db: DbExecutor = this.db,
  ): Promise<number> {
    if (suggestionIds.length === 0) {
      return 0;
    }

    const result = await db.pendingNodeSuggestion.deleteMany({
      where: {
        id: { in: [...suggestionIds] },
        userId,
      },
    });

    return result.count;
  }

  async listPendingByConversation(
    conversationId: string,
    userId: string,
    db: DbExecutor = this.db,
  ): Promise<readonly PendingNodeSuggestionRecord[]> {
    const rows = await db.pendingNodeSuggestion.findMany({
      where: {
        conversationId,
        userId,
        status: SUGGESTION_STATUS.pending,
      },
      select: suggestionSelect,
      orderBy: { createdAt: "asc" },
    });

    return rows.map(mapSuggestion);
  }
}
