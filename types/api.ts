import type {
  CreateKnowledgeNodeInput,
  KnowledgeNodeRecord,
  KnowledgeTreeNode,
  LinkType,
  NodeLinksGrouped,
  NodeMetadata,
  PendingNodeSuggestionRecord,
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

export interface KnowledgeTreeResponse {
  readonly tree: readonly KnowledgeTreeNode[];
}

export interface ApiErrorResponse {
  readonly error: string;
  readonly code: string;
  readonly details?: unknown;
}

export interface ChatRequest {
  readonly message: string;
  readonly conversationId?: string;
}

export interface SuggestedNodeResponse {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
}

export interface ChatResponse {
  readonly answer: string;
  readonly conversationId: string | null;
  readonly suggestedNodes: readonly SuggestedNodeResponse[];
}

export interface ChatHistoryMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly suggestedNodes?: readonly SuggestedNodeResponse[];
}

export interface ChatHistoryResponse {
  readonly conversationId: string | null;
  readonly messages: readonly ChatHistoryMessage[];
}

export interface ConversationSummaryResponse {
  readonly id: string;
  readonly title: string;
  readonly updatedAt: string;
}

export interface ConversationListResponse {
  readonly conversations: readonly ConversationSummaryResponse[];
}

export interface ConfirmSuggestionsRequest {
  readonly suggestionIds: readonly string[];
}

export interface ConfirmSuggestionsResponse {
  readonly nodes: readonly KnowledgeNodeResponse[];
}

export function toSuggestedNodeResponse(
  record: PendingNodeSuggestionRecord,
): SuggestedNodeResponse {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
  };
}

export function toSuggestedNodeResponses(
  records: readonly PendingNodeSuggestionRecord[],
): readonly SuggestedNodeResponse[] {
  return records.map(toSuggestedNodeResponse);
}

export type {
  CreateKnowledgeNodeInput,
  KnowledgeTreeNode,
  LinkType,
  UpdateKnowledgeNodeInput,
};

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

export function toConfirmSuggestionsResponse(
  nodes: readonly KnowledgeNodeRecord[],
): ConfirmSuggestionsResponse {
  return {
    nodes: nodes.map(toKnowledgeNodeResponse),
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
