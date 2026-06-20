import type { PrismaClient } from "@/app/generated/prisma/client";

import {
  SidePanelOrchestrator,
  createSidePanelOrchestratorDeps,
} from "@/lib/agents/sideOrchestrator";
import { DEFAULT_USER_ID } from "@/lib/constants/user";
import { ConversationRepository } from "@/lib/db/queries/conversations";
import type { ConversationRecord } from "@/lib/db/queries/conversations";
import { MessageRepository } from "@/lib/db/queries/messages";
import { KnowledgeNodeRepository } from "@/lib/db/queries/nodes";
import { SuggestionRepository } from "@/lib/db/queries/suggestions";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import type { KnowledgeNodeService } from "@/lib/services/knowledge-node.service";
import type { SideChatRequest, SideChatResponse } from "@/types/api";
import { toSuggestedNodeResponses } from "@/types/api";

export class SideChatService {
  private readonly orchestrator: SidePanelOrchestrator;

  constructor(
    private readonly db: PrismaClient,
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository,
    private readonly suggestionRepository: SuggestionRepository,
    private readonly knowledgeNodeRepository: KnowledgeNodeRepository,
    knowledgeNodeService: KnowledgeNodeService,
    private readonly userId: string = DEFAULT_USER_ID,
    orchestrator?: SidePanelOrchestrator,
  ) {
    this.orchestrator =
      orchestrator ??
      new SidePanelOrchestrator(
        createSidePanelOrchestratorDeps(
          knowledgeNodeService,
          messageRepository,
        ),
      );
  }

  async sendMessage(request: SideChatRequest): Promise<SideChatResponse> {
    const message = request.message.trim();

    if (message.length === 0) {
      throw new ValidationError("Message cannot be empty");
    }

    const conversation = await this.resolveSideConversation(
      request.contextNodeId,
      request.conversationId,
    );

    const result = await this.orchestrator.run({
      message,
      conversationId: conversation.id,
      contextNodeId: request.contextNodeId,
    });

    const persistedSuggestions = await this.db.$transaction(async (tx) => {
      await this.messageRepository.create(
        {
          conversationId: conversation.id,
          role: "user",
          content: message,
        },
        tx,
      );

      await this.messageRepository.create(
        {
          conversationId: conversation.id,
          role: "assistant",
          content: result.answer,
        },
        tx,
      );

      if (result.suggestedNodes.length === 0) {
        return [];
      }

      return this.suggestionRepository.createMany(
        result.suggestedNodes.map((draft) => ({
          userId: this.userId,
          conversationId: conversation.id,
          title: draft.title,
          description: draft.description,
        })),
        tx,
      );
    });

    return {
      answer: result.answer,
      conversationId: conversation.id,
      contextNodeId: request.contextNodeId,
      suggestedNodes: toSuggestedNodeResponses(persistedSuggestions),
    };
  }

  private async resolveSideConversation(
    contextNodeId: string,
    conversationId?: string,
  ): Promise<ConversationRecord> {
    const node = await this.knowledgeNodeRepository.findById(
      contextNodeId,
      this.userId,
    );

    if (node === null) {
      throw new NotFoundError("Knowledge node not found");
    }

    if (conversationId !== undefined) {
      const existing = await this.conversationRepository.findById(
        conversationId,
        this.userId,
      );

      if (
        existing === null ||
        existing.contextNodeId === null ||
        existing.contextNodeId !== contextNodeId
      ) {
        throw new NotFoundError("Conversation not found");
      }

      return existing;
    }

    return this.conversationRepository.getOrCreateSideConversation(
      contextNodeId,
      this.userId,
      node.title,
    );
  }
}
