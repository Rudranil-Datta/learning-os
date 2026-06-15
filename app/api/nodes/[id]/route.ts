import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createKnowledgeNodeService,
  handleApiError,
  toValidationDetails,
} from "@/lib/api/error-handler";
import { ValidationError } from "@/lib/errors/app-error";
import { updateKnowledgeNodeSchema } from "@/lib/validation/knowledge-node.schema";
import {
  toKnowledgeNodeDetailResponse,
  toKnowledgeNodeResponse,
  toUpdateKnowledgeNodeInput,
} from "@/types/api";

const knowledgeNodeService = createKnowledgeNodeService();
const nodeIdSchema = z.string().uuid();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const parsedId = nodeIdSchema.safeParse(id);

    if (!parsedId.success) {
      throw new ValidationError("Invalid node id");
    }

    const node = await knowledgeNodeService.getNodeById(parsedId.data);

    return NextResponse.json(toKnowledgeNodeDetailResponse(node));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const parsedId = nodeIdSchema.safeParse(id);

    if (!parsedId.success) {
      throw new ValidationError("Invalid node id");
    }

    const body: unknown = await request.json();
    const parsedBody = updateKnowledgeNodeSchema.safeParse(body);

    if (!parsedBody.success) {
      throw new ValidationError(
        "Invalid request body",
        toValidationDetails(parsedBody.error),
      );
    }

    const node = await knowledgeNodeService.updateNode(
      parsedId.data,
      toUpdateKnowledgeNodeInput(parsedBody.data),
    );

    return NextResponse.json(toKnowledgeNodeResponse(node));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const parsedId = nodeIdSchema.safeParse(id);

    if (!parsedId.success) {
      throw new ValidationError("Invalid node id");
    }

    await knowledgeNodeService.deleteNode(parsedId.data);

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
