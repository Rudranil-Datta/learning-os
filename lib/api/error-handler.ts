import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/client";
import { KnowledgeNodeRepository } from "@/lib/db/queries/nodes";
import { isAppError } from "@/lib/errors/app-error";
import { KnowledgeNodeService } from "@/lib/services/knowledge-node.service";
import type { ApiErrorResponse } from "@/types/api";

export function createKnowledgeNodeService(): KnowledgeNodeService {
  return new KnowledgeNodeService(new KnowledgeNodeRepository(prisma));
}

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  if (isAppError(error)) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
      { status: error.statusCode },
    );
  }

  console.error("Unhandled API error:", error);

  return NextResponse.json(
    {
      error: "Something went wrong",
      code: "INTERNAL_ERROR",
    },
    { status: 500 },
  );
}

export function toValidationDetails(error: {
  flatten: () => unknown;
}): unknown {
  return error.flatten();
}
