import type {
  CreateKnowledgeNodeInput,
  LinkType,
  NodeLinksGrouped,
  NodeMetadata,
  UpdateKnowledgeNodeInput,
} from "@/types/database";

export interface CreateKnowledgeNodeRequest {
  readonly title: string;
  readonly description?: string | null;
  readonly explanation?: string | null;
  readonly summary?: string | null;
  readonly metadata?: NodeMetadata;
}

export interface UpdateKnowledgeNodeRequest {
  readonly title?: string;
  readonly description?: string | null;
  readonly explanation?: string | null;
  readonly summary?: string | null;
  readonly metadata?: NodeMetadata;
}

export interface KnowledgeNodeResponse {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly explanation: string | null;
  readonly summary: string | null;
  readonly metadata: NodeMetadata;
  readonly userId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface KnowledgeNodeDetailResponse extends KnowledgeNodeResponse {
  readonly links: NodeLinksGrouped;
}

export interface KnowledgeNodeListResponse {
  readonly nodes: readonly KnowledgeNodeResponse[];
}

export interface ApiErrorResponse {
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
}

export type { CreateKnowledgeNodeInput, LinkType, UpdateKnowledgeNodeInput };

export function toCreateKnowledgeNodeInput(
  request: CreateKnowledgeNodeRequest,
): CreateKnowledgeNodeInput {
  return {
    title: request.title,
    description: request.description,
    explanation: request.explanation,
    summary: request.summary,
    metadata: request.metadata,
  };
}

export function toUpdateKnowledgeNodeInput(
  request: UpdateKnowledgeNodeRequest,
): UpdateKnowledgeNodeInput {
  return {
    title: request.title,
    description: request.description,
    explanation: request.explanation,
    summary: request.summary,
    metadata: request.metadata,
  };
}

export function toKnowledgeNodeResponse(node: {
  id: string;
  title: string;
  description: string | null;
  explanation: string | null;
  summary: string | null;
  metadata: NodeMetadata;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}): KnowledgeNodeResponse {
  return {
    id: node.id,
    title: node.title,
    description: node.description,
    explanation: node.explanation,
    summary: node.summary,
    metadata: node.metadata,
    userId: node.userId,
    createdAt: node.createdAt.toISOString(),
    updatedAt: node.updatedAt.toISOString(),
  };
}

export function toKnowledgeNodeDetailResponse(node: {
  id: string;
  title: string;
  description: string | null;
  explanation: string | null;
  summary: string | null;
  metadata: NodeMetadata;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  links: NodeLinksGrouped;
}): KnowledgeNodeDetailResponse {
  return {
    ...toKnowledgeNodeResponse(node),
    links: node.links,
  };
}
