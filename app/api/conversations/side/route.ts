import { NextResponse } from "next/server";

import {
  createConversationService,
  handleApiError,
  toValidationDetails,
} from "@/lib/api/error-handler";
import { ValidationError } from "@/lib/errors/app-error";
import { getOrCreateSideConversationSchema } from "@/lib/validation/conversation.schema";
import type { SideConversationResponse } from "@/types/api";

const conversationService = createConversationService();

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = getOrCreateSideConversationSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(
        "Invalid request body",
        toValidationDetails(parsed.error),
      );
    }

    const conversation = await conversationService.getOrCreateSideConversation(
      parsed.data.contextNodeId,
    );

    const response: SideConversationResponse = {
      id: conversation.id,
      contextNodeId: conversation.contextNodeId,
      title: conversation.title,
      createdAt: conversation.createdAt,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
