import { NextResponse } from "next/server";

import {
  createChatService,
  handleApiError,
  toValidationDetails,
} from "@/lib/api/error-handler";
import { ValidationError } from "@/lib/errors/app-error";
import {
  chatHistoryQuerySchema,
  chatRequestSchema,
} from "@/lib/validation/chat.schema";

const chatService = createChatService();

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = chatHistoryQuerySchema.safeParse({
      conversationId: searchParams.get("conversationId") ?? undefined,
    });

    if (!parsed.success) {
      throw new ValidationError(
        "Invalid query parameters",
        toValidationDetails(parsed.error),
      );
    }

    const result = await chatService.getMainChatHistory(
      parsed.data.conversationId,
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(
        "Invalid request body",
        toValidationDetails(parsed.error),
      );
    }

    const result = await chatService.sendMessage(parsed.data);

    return NextResponse.json(result);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
