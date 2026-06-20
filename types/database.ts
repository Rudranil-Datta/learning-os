export type LinkType = "parent" | "child" | "related";

export const SUGGESTION_STATUS = {
  pending: "pending",
  confirmed: "confirmed",
  rejected: "rejected",
} as const;

export type SuggestionStatus =
  (typeof SUGGESTION_STATUS)[keyof typeof SUGGESTION_STATUS];

export const DEFAULT_SUGGESTION_STATUS: SuggestionStatus =
  SUGGESTION_STATUS.pending;

export type NodeMetadata = Record<string, unknown>;

export interface KnowledgeNodeRecord {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly explanation: string | null;
  readonly summary: string | null;
  readonly metadata: NodeMetadata;
  readonly userId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface LinkedNodeSummary {
  readonly id: string;
  readonly title: string;
}

/** Nested parent-child node for knowledge tree (parent links only). */
export interface KnowledgeTreeNode {
  readonly id: string;
  readonly title: string;
  readonly children: readonly KnowledgeTreeNode[];
}

export interface NodeLinksGrouped {
  readonly parents: readonly LinkedNodeSummary[];
  readonly children: readonly LinkedNodeSummary[];
  readonly related: readonly LinkedNodeSummary[];
}

export interface KnowledgeNodeWithLinks extends KnowledgeNodeRecord {
  readonly links: NodeLinksGrouped;
}

export interface CreateKnowledgeNodeInput {
  readonly title: string;
  readonly description?: string | null;
  readonly explanation?: string | null;
  readonly summary?: string | null;
  readonly metadata?: NodeMetadata;
}

export interface UpdateKnowledgeNodeInput {
  readonly title?: string;
  readonly description?: string | null;
  readonly explanation?: string | null;
  readonly summary?: string | null;
  readonly metadata?: NodeMetadata;
}

export interface SuggestedNodeDraft {
  readonly title: string;
  readonly description: string | null;
}

export interface NodeExtractorInput {
  readonly question: string;
  readonly answer: string;
  readonly existingNodeTitles?: readonly string[];
}

export interface NodeExtractorResult {
  readonly suggestions: readonly SuggestedNodeDraft[];
}

export interface PendingNodeSuggestionRecord {
  readonly id: string;
  readonly userId: string;
  readonly conversationId: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: SuggestionStatus;
  readonly createdAt: Date;
}

export interface CreatePendingNodeSuggestionInput {
  readonly userId: string;
  readonly conversationId: string;
  readonly title: string;
  readonly description?: string | null;
  readonly status?: SuggestionStatus;
}

export interface NodeLinkRecord {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly linkType: LinkType;
  readonly userId: string;
  readonly createdAt: Date;
}

export interface CreateNodeLinkInput {
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly linkType: LinkType;
}

export interface NodeExplanationCandidate {
  readonly id: string;
  readonly explanation: string;
}

/** Normalized parent→child edge for tree building (`link_type='parent'`). */
export interface ParentChildTreeEdge {
  readonly parentId: string;
  readonly parentTitle: string;
  readonly childId: string;
  readonly childTitle: string;
}
