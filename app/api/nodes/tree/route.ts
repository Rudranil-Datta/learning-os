import { NextResponse } from "next/server";

import {
  createKnowledgeNodeService,
  handleApiError,
} from "@/lib/api/error-handler";
import type { KnowledgeTreeResponse } from "@/types/api";

const knowledgeNodeService = createKnowledgeNodeService();

export async function GET(): Promise<NextResponse> {
  try {
    const tree = await knowledgeNodeService.getKnowledgeTree();

    const response: KnowledgeTreeResponse = { tree };

    return NextResponse.json(response);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
