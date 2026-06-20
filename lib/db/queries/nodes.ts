import type { Prisma, PrismaClient } from "@/app/generated/prisma/client";
import {
  KNOWLEDGE_NODE_TSQUERY_CONFIG,
} from "@/lib/utils/search";
import type {
  CreateKnowledgeNodeInput,
  KnowledgeNodeRecord,
  KnowledgeNodeWithLinks,
  LinkedNodeSummary,
  NodeLinksGrouped,
  NodeMetadata,
  UpdateKnowledgeNodeInput,
} from "@/types/database";

const knowledgeNodeSelect = {
  id: true,
  title: true,
  description: true,
  explanation: true,
  summary: true,
  metadata: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
} as const;

type KnowledgeNodeRow = Prisma.KnowledgeNodeGetPayload<{
  select: typeof knowledgeNodeSelect;
}>;

type NodeLinkRow = Prisma.NodeLinkGetPayload<{
  select: {
    linkType: true;
    sourceNodeId: true;
    targetNodeId: true;
    sourceNode: { select: { id: true; title: true } };
    targetNode: { select: { id: true; title: true } };
  };
}>;

function asNodeMetadata(value: Prisma.JsonValue): NodeMetadata {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as NodeMetadata;
  }

  return {};
}

function toInputJsonValue(metadata: NodeMetadata): Prisma.InputJsonValue {
  return metadata as Prisma.InputJsonValue;
}

type DbExecutor = PrismaClient | Prisma.TransactionClient;

type KnowledgeNodeSearchRow = {
  id: string;
  title: string;
  description: string | null;
  explanation: string | null;
  summary: string | null;
  metadata: Prisma.JsonValue;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

function mapKnowledgeNodeFromSearchRow(
  row: KnowledgeNodeSearchRow,
): KnowledgeNodeRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    explanation: row.explanation,
    summary: row.summary,
    metadata: asNodeMetadata(row.metadata),
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapKnowledgeNode(row: KnowledgeNodeRow): KnowledgeNodeRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    explanation: row.explanation,
    summary: row.summary,
    metadata: asNodeMetadata(row.metadata),
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function addUniqueLink(
  target: LinkedNodeSummary[],
  seen: Set<string>,
  node: LinkedNodeSummary,
): void {
  if (seen.has(node.id)) {
    return;
  }

  seen.add(node.id);
  target.push(node);
}

function groupLinks(nodeId: string, links: readonly NodeLinkRow[]): NodeLinksGrouped {
  const parents: LinkedNodeSummary[] = [];
  const children: LinkedNodeSummary[] = [];
  const related: LinkedNodeSummary[] = [];
  const seenParents = new Set<string>();
  const seenChildren = new Set<string>();
  const seenRelated = new Set<string>();

  for (const link of links) {
    if (
      link.linkType === "parent" &&
      link.targetNodeId === nodeId &&
      link.sourceNode
    ) {
      addUniqueLink(parents, seenParents, link.sourceNode);
    }

    if (
      link.linkType === "parent" &&
      link.sourceNodeId === nodeId &&
      link.targetNode
    ) {
      addUniqueLink(children, seenChildren, link.targetNode);
    }

    if (
      link.linkType === "child" &&
      link.sourceNodeId === nodeId &&
      link.targetNode
    ) {
      addUniqueLink(children, seenChildren, link.targetNode);
    }

    if (
      link.linkType === "child" &&
      link.targetNodeId === nodeId &&
      link.sourceNode
    ) {
      addUniqueLink(parents, seenParents, link.sourceNode);
    }

    if (link.linkType === "related") {
      const otherNode =
        link.sourceNodeId === nodeId ? link.targetNode : link.sourceNode;

      if (otherNode) {
        addUniqueLink(related, seenRelated, otherNode);
      }
    }
  }

  return { parents, children, related };
}

export class KnowledgeNodeRepository {
  constructor(private readonly db: PrismaClient) {}

  async listByUserId(userId: string): Promise<KnowledgeNodeRecord[]> {
    const rows = await this.db.knowledgeNode.findMany({
      where: { userId },
      select: knowledgeNodeSelect,
      orderBy: { updatedAt: "desc" },
    });

    return rows.map(mapKnowledgeNode);
  }

  async searchByUserId(
    userId: string,
    query: string,
  ): Promise<KnowledgeNodeRecord[]> {
    const rows = await this.db.$queryRaw<KnowledgeNodeSearchRow[]>`
      SELECT
        id,
        title,
        description,
        explanation,
        summary,
        metadata,
        user_id AS "userId",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM knowledge_nodes
      WHERE user_id = ${userId}::uuid
        AND to_tsvector(${KNOWLEDGE_NODE_TSQUERY_CONFIG}, title || ' ' || COALESCE(description, ''))
          @@ plainto_tsquery(${KNOWLEDGE_NODE_TSQUERY_CONFIG}, ${query})
      ORDER BY updated_at DESC
    `;

    return rows.map(mapKnowledgeNodeFromSearchRow);
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<KnowledgeNodeWithLinks | null> {
    const row = await this.db.knowledgeNode.findFirst({
      where: { id, userId },
      select: knowledgeNodeSelect,
    });

    if (!row) {
      return null;
    }

    const links = await this.db.nodeLink.findMany({
      where: {
        userId,
        OR: [{ sourceNodeId: id }, { targetNodeId: id }],
      },
      select: {
        linkType: true,
        sourceNodeId: true,
        targetNodeId: true,
        sourceNode: { select: { id: true, title: true } },
        targetNode: { select: { id: true, title: true } },
      },
    });

    return {
      ...mapKnowledgeNode(row),
      links: groupLinks(id, links),
    };
  }

  async create(
    data: CreateKnowledgeNodeInput,
    userId: string,
    db: DbExecutor = this.db,
  ): Promise<KnowledgeNodeRecord> {
    const row = await db.knowledgeNode.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        explanation: data.explanation ?? null,
        summary: data.summary ?? null,
        metadata: toInputJsonValue(data.metadata ?? {}),
        userId,
      },
      select: knowledgeNodeSelect,
    });

    return mapKnowledgeNode(row);
  }

  async update(
    id: string,
    data: UpdateKnowledgeNodeInput,
    userId: string,
  ): Promise<KnowledgeNodeRecord | null> {
    const existing = await this.db.knowledgeNode.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    const row = await this.db.knowledgeNode.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.explanation !== undefined
          ? { explanation: data.explanation }
          : {}),
        ...(data.summary !== undefined ? { summary: data.summary } : {}),
        ...(data.metadata !== undefined
          ? { metadata: toInputJsonValue(data.metadata) }
          : {}),
      },
      select: knowledgeNodeSelect,
    });

    return mapKnowledgeNode(row);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.db.knowledgeNode.deleteMany({
      where: { id, userId },
    });

    return result.count > 0;
  }
}
