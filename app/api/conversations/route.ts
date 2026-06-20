import { NextResponse } from "next/server";

import {
  createConversationService,
  handleApiError,
} from "@/lib/api/error-handler";
import type { ConversationListResponse, ConversationSummaryResponse } from "@/types/api";

const conversationService = createConversationService();

function toConversationSummaryResponse(conversation: {
  id: string;
  title: string;
  updatedAt: string;
}): ConversationSummaryResponse {
  return {
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updatedAt,
  };
}

export async function GET(): Promise<NextResponse> {
  try {
    const conversations = await conversationService.listMainConversations();

    const response: ConversationListResponse = {
      conversations: conversations.map(toConversationSummaryResponse),
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(): Promise<NextResponse> {
  try {
    const conversation = await conversationService.createMainConversation();

    return NextResponse.json(toConversationSummaryResponse(conversation), {
      status: 201,
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
