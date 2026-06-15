import { NextResponse } from "next/server";

import {
  createKnowledgeNodeService,
  handleApiError,
  toValidationDetails,
} from "@/lib/api/error-handler";
import { ValidationError } from "@/lib/errors/app-error";
import { createKnowledgeNodeSchema } from "@/lib/validation/knowledge-node.schema";
import {
  toCreateKnowledgeNodeInput,
  toKnowledgeNodeResponse,
} from "@/types/api";

const knowledgeNodeService = createKnowledgeNodeService();

export async function GET(): Promise<NextResponse> {
  try {
    const nodes = await knowledgeNodeService.listNodes();

    return NextResponse.json({
      nodes: nodes.map(toKnowledgeNodeResponse),
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = createKnowledgeNodeSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(
        "Invalid request body",
        toValidationDetails(parsed.error),
      );
    }

    const node = await knowledgeNodeService.createNode(
      toCreateKnowledgeNodeInput(parsed.data),
    );

    return NextResponse.json(toKnowledgeNodeResponse(node), { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
