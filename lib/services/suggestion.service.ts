import { Prisma, type PrismaClient } from "@/app/generated/prisma/client";

import { DEFAULT_USER_ID } from "@/lib/constants/user";
import { KnowledgeNodeRepository } from "@/lib/db/queries/nodes";
import { SuggestionRepository } from "@/lib/db/queries/suggestions";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors/app-error";
import { AutoLinkService } from "@/lib/services/auto-link.service";
import type { KnowledgeNodeRecord } from "@/types/database";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export interface ConfirmSuggestionsResult {
  readonly nodes: readonly KnowledgeNodeRecord[];
}

export class SuggestionService {
  constructor(
    private readonly db: PrismaClient,
    private readonly suggestionRepository: SuggestionRepository,
    private readonly knowledgeNodeRepository: KnowledgeNodeRepository,
    private readonly autoLinkService: AutoLinkService,
    private readonly userId: string = DEFAULT_USER_ID,
  ) {}

  async confirmSuggestions(
    suggestionIds: readonly string[],
  ): Promise<ConfirmSuggestionsResult> {
    if (suggestionIds.length === 0) {
      throw new ValidationError("At least one suggestion id is required");
    }

    const uniqueIds = [...new Set(suggestionIds)];
    const suggestions = await this.suggestionRepository.findPendingByIds(
      uniqueIds,
      this.userId,
    );

    if (suggestions.length !== uniqueIds.length) {
      throw new NotFoundError("One or more pending suggestions were not found");
    }

    try {
      const nodes = await this.db.$transaction(async (tx) => {
        const createdNodes: KnowledgeNodeRecord[] = [];

        for (const suggestion of suggestions) {
          const node = await this.knowledgeNodeRepository.create(
            {
              title: suggestion.title,
              description: suggestion.description,
            },
            this.userId,
            tx,
          );

          await this.autoLinkService.createRelatedLinksForNode(
            {
              id: node.id,
              title: node.title,
            },
            tx,
          );

          createdNodes.push(node);
        }

        await this.suggestionRepository.deleteManyByIds(
          uniqueIds,
          this.userId,
          tx,
        );

        return createdNodes;
      });

      return { nodes };
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("A knowledge node with this title already exists");
      }

      throw error;
    }
  }

  async rejectSuggestion(suggestionId: string): Promise<void> {
    const suggestion = await this.suggestionRepository.findPendingById(
      suggestionId,
      this.userId,
    );

    if (!suggestion) {
      throw new NotFoundError("Pending suggestion not found");
    }

    await this.suggestionRepository.deleteById(suggestionId, this.userId);
  }
}
