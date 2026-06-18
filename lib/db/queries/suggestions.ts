import type { Prisma, PrismaClient } from "@/app/generated/prisma/client";

import {
  DEFAULT_SUGGESTION_STATUS,
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
}
