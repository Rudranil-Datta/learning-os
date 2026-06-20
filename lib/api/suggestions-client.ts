import type {
  ApiErrorResponse,
  ConfirmSuggestionsRequest,
  ConfirmSuggestionsResponse,
} from "@/types/api";

export class SuggestionsApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "SuggestionsApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function isSuggestionsApiError(
  error: unknown,
): error is SuggestionsApiError {
  return error instanceof SuggestionsApiError;
}

async function throwSuggestionsApiError(response: Response): Promise<never> {
  const body: unknown = await response.json().catch(() => null);

  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    "code" in body &&
    typeof body.error === "string" &&
    typeof body.code === "string"
  ) {
    const errorBody = body as ApiErrorResponse;

    throw new SuggestionsApiError(
      errorBody.error,
      response.status,
      errorBody.code,
      errorBody.details,
    );
  }

  throw new SuggestionsApiError(
    "Request failed",
    response.status,
    "INTERNAL_ERROR",
  );
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const body: unknown = await response.json();

  if (!response.ok) {
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      "code" in body &&
      typeof body.error === "string" &&
      typeof body.code === "string"
    ) {
      const errorBody = body as ApiErrorResponse;

      throw new SuggestionsApiError(
        errorBody.error,
        response.status,
        errorBody.code,
        errorBody.details,
      );
    }

    throw new SuggestionsApiError(
      "Request failed",
      response.status,
      "INTERNAL_ERROR",
    );
  }

  return body as T;
}

export async function confirmSuggestions(
  request: ConfirmSuggestionsRequest,
): Promise<ConfirmSuggestionsResponse> {
  const response = await fetch("/api/nodes/suggestions/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      suggestionIds: request.suggestionIds,
    }),
  });

  return parseApiResponse<ConfirmSuggestionsResponse>(response);
}

export async function rejectSuggestion(suggestionId: string): Promise<void> {
  const response = await fetch(
    `/api/nodes/suggestions/${encodeURIComponent(suggestionId)}`,
    {
      method: "DELETE",
    },
  );

  if (response.ok) {
    return;
  }

  await throwSuggestionsApiError(response);
}
