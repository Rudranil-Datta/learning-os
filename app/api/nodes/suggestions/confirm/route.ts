import { NextResponse } from "next/server";

import {
  createSuggestionService,
  handleApiError,
  toValidationDetails,
} from "@/lib/api/error-handler";
import { ValidationError } from "@/lib/errors/app-error";
import { confirmSuggestionsSchema } from "@/lib/validation/suggestion.schema";
import { toConfirmSuggestionsResponse } from "@/types/api";

const suggestionService = createSuggestionService();

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = confirmSuggestionsSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(
        "Invalid request body",
        toValidationDetails(parsed.error),
      );
    }

    const result = await suggestionService.confirmSuggestions(
      parsed.data.suggestionIds,
    );

    return NextResponse.json(toConfirmSuggestionsResponse(result.nodes));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
