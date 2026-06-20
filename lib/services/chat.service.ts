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
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import type { KnowledgeNodeService } from "@/lib/services/knowledge-node.service";
import type {
  ChatHistoryMessage,
  ChatHistoryResponse,
  ChatRequest,
  ChatResponse,
} from "@/types/api";
import { toSuggestedNodeResponses } from "@/types/api";
import type { ChatMessage } from "@/types/llm";

export const MAIN_CHAT_HISTORY_MESSAGE_LIMIT = 10;
export const MAIN_CHAT_UI_HISTORY_MESSAGE_LIMIT = 100;

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

function truncateMainConversationTitle(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  const maxLength = 64;

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
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

    if (!conversation.title) {
      await this.conversationRepository.updateTitle(
        conversation.id,
        truncateMainConversationTitle(message),
        this.userId,
      );
    }

    return {
      answer: result.answer,
      conversationId: conversation.id,
      suggestedNodes: toSuggestedNodeResponses(persistedSuggestions),
    };
  }

  async getMainChatHistory(
    conversationId?: string,
  ): Promise<ChatHistoryResponse> {
    if (conversationId === undefined) {
      const latest =
        await this.conversationRepository.findLatestMainConversation(
          this.userId,
        );

      if (latest === null) {
        return {
          conversationId: null,
          messages: [],
        };
      }

      return this.getMainChatHistory(latest.id);
    }

    const conversation = await this.conversationRepository.findById(
      conversationId,
      this.userId,
    );

    if (conversation === null || conversation.contextNodeId !== null) {
      throw new NotFoundError("Conversation not found");
    }

    const [messages, pendingSuggestions] = await Promise.all([
      this.messageRepository.listByConversation(
        conversation.id,
        MAIN_CHAT_UI_HISTORY_MESSAGE_LIMIT,
      ),
      this.suggestionRepository.listPendingByConversation(
        conversation.id,
        this.userId,
      ),
    ]);

    const historyMessages: ChatHistoryMessage[] = messages.flatMap((message) => {
      if (message.role !== "user" && message.role !== "assistant") {
        return [];
      }

      return [
        {
          id: message.id,
          role: message.role,
          content: message.content,
        },
      ];
    });

    if (pendingSuggestions.length > 0) {
      let lastAssistantIndex = -1;

      for (let index = historyMessages.length - 1; index >= 0; index -= 1) {
        if (historyMessages[index].role === "assistant") {
          lastAssistantIndex = index;
          break;
        }
      }

      if (lastAssistantIndex >= 0) {
        historyMessages[lastAssistantIndex] = {
          ...historyMessages[lastAssistantIndex],
          suggestedNodes: toSuggestedNodeResponses(pendingSuggestions),
        };
      }
    }

    return {
      conversationId: conversation.id,
      messages: historyMessages,
    };
  }
}
