import type {
  ApiErrorResponse,
  CreateKnowledgeNodeRequest,
  KnowledgeNodeListResponse,
  KnowledgeNodeResponse,
} from "@/types/api";

export class NodesApiError extends Error {
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
    this.name = "NodesApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function isNodesApiError(error: unknown): error is NodesApiError {
  return error instanceof NodesApiError;
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

      throw new NodesApiError(
        errorBody.error,
        response.status,
        errorBody.code,
        errorBody.details,
      );
    }

    throw new NodesApiError(
      "Request failed",
      response.status,
      "INTERNAL_ERROR",
    );
  }

  return body as T;
}

export async function listNodes(
  searchQuery?: string,
): Promise<readonly KnowledgeNodeResponse[]> {
  const url =
    searchQuery === undefined
      ? "/api/nodes"
      : `/api/nodes?q=${encodeURIComponent(searchQuery)}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseApiResponse<KnowledgeNodeListResponse>(response);

  return data.nodes;
}

export async function createNode(
  request: CreateKnowledgeNodeRequest,
): Promise<KnowledgeNodeResponse> {
  const response = await fetch("/api/nodes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  return parseApiResponse<KnowledgeNodeResponse>(response);
}
