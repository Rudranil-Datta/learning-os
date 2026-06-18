import type { PrismaClient } from "@/app/generated/prisma/client";

import {
  MainChatOrchestrator,
  createNodeLookupFromService,
} from "@/lib/agents/orchestrator";
import { DEFAULT_USER_ID } from "@/lib/constants/user";
import { ConversationRepository } from "@/lib/db/queries/conversations";
import type { MessageRecord } from "@/lib/db/queries/messages";
import { MessageRepository } from "@/lib/db/queries/messages";
import { SuggestionRepository } from "@/lib/db/queries/suggestions";
import { ValidationError } from "@/lib/errors/app-error";
import type { KnowledgeNodeService } from "@/lib/services/knowledge-node.service";
import type { ChatRequest, ChatResponse } from "@/types/api";
import { toSuggestedNodeResponses } from "@/types/api";
import type { ChatMessage } from "@/types/llm";

export const MAIN_CHAT_HISTORY_MESSAGE_LIMIT = 10;

function toChatHistory(messages: readonly MessageRecord[]): readonly ChatMessage[] {
  return messages
    .filter(
      (record) => record.role === "user" || record.role === "assistant",
    )
    .map((record) => ({
      role: record.role,
      content: record.content,
    }));
}

export class ChatService {
  private readonly orchestrator: MainChatOrchestrator;

  constructor(
    private readonly db: PrismaClient,
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository,
    private readonly suggestionRepository: SuggestionRepository,
    knowledgeNodeService: KnowledgeNodeService,
    private readonly userId: string = DEFAULT_USER_ID,
    orchestrator?: MainChatOrchestrator,
  ) {
    this.orchestrator =
      orchestrator ??
      new MainChatOrchestrator(createNodeLookupFromService(knowledgeNodeService));
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const message = request.message.trim();

    if (message.length === 0) {
      throw new ValidationError("Message cannot be empty");
    }

    const conversation =
      await this.conversationRepository.getOrCreateMainConversation(
        this.userId,
        request.conversationId,
      );

    const history = await this.messageRepository.listRecentByConversation(
      conversation.id,
      MAIN_CHAT_HISTORY_MESSAGE_LIMIT,
    );

    const result = await this.orchestrator.run({
      message,
      conversationId: conversation.id,
      history: toChatHistory(history),
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
      suggestedNodes: toSuggestedNodeResponses(persistedSuggestions),
    };
  }
}
