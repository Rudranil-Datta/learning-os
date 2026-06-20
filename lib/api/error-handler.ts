import { NextResponse } from "next/server";

import { SidePanelOrchestrator, createSidePanelOrchestratorDeps } from "@/lib/agents/sideOrchestrator";
import { prisma } from "@/lib/db/client";
import { ConversationRepository } from "@/lib/db/queries/conversations";
import { LinkRepository } from "@/lib/db/queries/links";
import { MessageRepository } from "@/lib/db/queries/messages";
import { KnowledgeNodeRepository } from "@/lib/db/queries/nodes";
import { SuggestionRepository } from "@/lib/db/queries/suggestions";
import { isAppError } from "@/lib/errors/app-error";
import { AutoLinkService } from "@/lib/services/auto-link.service";
import { ChatService } from "@/lib/services/chat.service";
import { ConversationService } from "@/lib/services/conversation.service";
import { KnowledgeNodeService } from "@/lib/services/knowledge-node.service";
import { SideChatService } from "@/lib/services/side-chat.service";
import { SuggestionService } from "@/lib/services/suggestion.service";
import type { ApiErrorResponse } from "@/types/api";

export function createKnowledgeNodeService(): KnowledgeNodeService {
  return new KnowledgeNodeService(
    new KnowledgeNodeRepository(prisma),
    new LinkRepository(prisma),
  );
}

export function createConversationService(): ConversationService {
  return new ConversationService(
    new ConversationRepository(prisma),
    new KnowledgeNodeRepository(prisma),
  );
}

export function createSuggestionService(): SuggestionService {
  const linkRepository = new LinkRepository(prisma);

  return new SuggestionService(
    prisma,
    new SuggestionRepository(prisma),
    new KnowledgeNodeRepository(prisma),
    new AutoLinkService(linkRepository),
  );
}

export function createChatService(): ChatService {
  const knowledgeNodeService = createKnowledgeNodeService();

  return new ChatService(
    prisma,
    new ConversationRepository(prisma),
    new MessageRepository(prisma),
    new SuggestionRepository(prisma),
    knowledgeNodeService,
  );
}

export function createSidePanelOrchestrator(): SidePanelOrchestrator {
  const knowledgeNodeService = createKnowledgeNodeService();
  const messageRepository = new MessageRepository(prisma);

  return new SidePanelOrchestrator(
    createSidePanelOrchestratorDeps(knowledgeNodeService, messageRepository),
  );
}

export function createSideChatService(): SideChatService {
  const knowledgeNodeService = createKnowledgeNodeService();

  return new SideChatService(
    prisma,
    new ConversationRepository(prisma),
    new MessageRepository(prisma),
    new SuggestionRepository(prisma),
    new KnowledgeNodeRepository(prisma),
    knowledgeNodeService,
  );
}

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  if (isAppError(error)) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
      { status: error.statusCode },
    );
  }

  console.error("Unhandled API error:", error);

  return NextResponse.json(
    {
      error: "Something went wrong",
      code: "INTERNAL_ERROR",
    },
    { status: 500 },
  );
}

export function toValidationDetails(error: {
  flatten: () => unknown;
}): unknown {
  return error.flatten();
}
