import type {
  ApiErrorResponse,
  SideChatRequest,
  SideChatResponse,
} from "@/types/api";

export class SideChatApiError extends Error {
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
    this.name = "SideChatApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function isSideChatApiError(error: unknown): error is SideChatApiError {
  return error instanceof SideChatApiError;
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

      throw new SideChatApiError(
        errorBody.error,
        response.status,
        errorBody.code,
        errorBody.details,
      );
    }

    throw new SideChatApiError(
      "Request failed",
      response.status,
      "INTERNAL_ERROR",
    );
  }

  return body as T;
}

export async function sendSideMessage(
  request: SideChatRequest,
): Promise<SideChatResponse> {
  const response = await fetch("/api/sidechat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  return parseApiResponse<SideChatResponse>(response);
}
