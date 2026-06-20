import { NextResponse } from "next/server";

import {
  createSuggestionService,
  handleApiError,
} from "@/lib/api/error-handler";
import { ValidationError } from "@/lib/errors/app-error";
import { suggestionIdParamSchema } from "@/lib/validation/suggestion.schema";

const suggestionService = createSuggestionService();

type RouteContext = {
  params: Promise<{ suggestionId: string }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { suggestionId } = await context.params;
    const parsed = suggestionIdParamSchema.safeParse({ suggestionId });

    if (!parsed.success) {
      throw new ValidationError("Invalid suggestion id");
    }

    await suggestionService.rejectSuggestion(parsed.data.suggestionId);

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
