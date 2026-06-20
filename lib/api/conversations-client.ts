import type {
  ApiErrorResponse,
  ConversationListResponse,
  ConversationSummaryResponse,
  GetOrCreateSideConversationRequest,
  SideConversationResponse,
} from "@/types/api";

export class ConversationsApiError extends Error {
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
    this.name = "ConversationsApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function isConversationsApiError(
  error: unknown,
): error is ConversationsApiError {
  return error instanceof ConversationsApiError;
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

      throw new ConversationsApiError(
        errorBody.error,
        response.status,
        errorBody.code,
        errorBody.details,
      );
    }

    throw new ConversationsApiError(
      "Request failed",
      response.status,
      "INTERNAL_ERROR",
    );
  }

  return body as T;
}

export async function listConversations(): Promise<
  readonly ConversationSummaryResponse[]
> {
  const response = await fetch("/api/conversations", {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseApiResponse<ConversationListResponse>(response);

  return data.conversations;
}

export async function createConversation(): Promise<ConversationSummaryResponse> {
  const response = await fetch("/api/conversations", {
    method: "POST",
  });

  return parseApiResponse<ConversationSummaryResponse>(response);
}

export async function getOrCreateSideConversation(
  request: GetOrCreateSideConversationRequest,
): Promise<SideConversationResponse> {
  const response = await fetch("/api/conversations/side", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    cache: "no-store",
  });

  return parseApiResponse<SideConversationResponse>(response);
}
