import { NextResponse } from "next/server";

import {
  createChatService,
  handleApiError,
  toValidationDetails,
} from "@/lib/api/error-handler";
import { ValidationError } from "@/lib/errors/app-error";
import { chatRequestSchema } from "@/lib/validation/chat.schema";

const chatService = createChatService();

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
