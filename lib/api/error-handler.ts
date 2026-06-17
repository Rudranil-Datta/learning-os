import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/client";
import { ConversationRepository } from "@/lib/db/queries/conversations";
import { MessageRepository } from "@/lib/db/queries/messages";
import { KnowledgeNodeRepository } from "@/lib/db/queries/nodes";
import { isAppError } from "@/lib/errors/app-error";
import { ChatService } from "@/lib/services/chat.service";
import { KnowledgeNodeService } from "@/lib/services/knowledge-node.service";
import type { ApiErrorResponse } from "@/types/api";

export function createKnowledgeNodeService(): KnowledgeNodeService {
  return new KnowledgeNodeService(new KnowledgeNodeRepository(prisma));
}

export function createChatService(): ChatService {
  const knowledgeNodeService = createKnowledgeNodeService();

  return new ChatService(
    new ConversationRepository(prisma),
    new MessageRepository(prisma),
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
