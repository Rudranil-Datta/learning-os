import type { Prisma, PrismaClient } from "@/app/generated/prisma/client";

import type {
  CreateNodeLinkInput,
  LinkType,
  NodeExplanationCandidate,
  NodeLinkRecord,
  ParentChildTreeEdge,
} from "@/types/database";

const nodeLinkSelect = {
  id: true,
  sourceNodeId: true,
  targetNodeId: true,
  linkType: true,
  userId: true,
  createdAt: true,
} as const;

type NodeLinkRow = Prisma.NodeLinkGetPayload<{
  select: typeof nodeLinkSelect;
}>;

type DbExecutor = PrismaClient | Prisma.TransactionClient;

const parentChildTreeEdgeSelect = {
  sourceNodeId: true,
  targetNodeId: true,
  sourceNode: { select: { id: true, title: true } },
  targetNode: { select: { id: true, title: true } },
} as const;

type ParentChildTreeEdgeRow = Prisma.NodeLinkGetPayload<{
  select: typeof parentChildTreeEdgeSelect;
}>;

function mapParentChildTreeEdge(row: ParentChildTreeEdgeRow): ParentChildTreeEdge | null {
  if (
    row.sourceNodeId === null ||
    row.targetNodeId === null ||
    row.sourceNode === null ||
    row.targetNode === null
  ) {
    return null;
  }

  return {
    parentId: row.sourceNode.id,
    parentTitle: row.sourceNode.title,
    childId: row.targetNode.id,
    childTitle: row.targetNode.title,
  };
}

function mapNodeLink(row: NodeLinkRow): NodeLinkRecord {
  if (row.sourceNodeId === null || row.targetNodeId === null) {
    throw new Error("Node link row missing source or target node id");
  }

  return {
    id: row.id,
    sourceNodeId: row.sourceNodeId,
    targetNodeId: row.targetNodeId,
    linkType: row.linkType,
    userId: row.userId,
    createdAt: row.createdAt,
  };
}

export class LinkRepository {
  constructor(private readonly db: PrismaClient) {}

  async listExplanationCandidates(
    userId: string,
    excludeNodeId: string,
    db: DbExecutor = this.db,
  ): Promise<readonly NodeExplanationCandidate[]> {
    const rows = await db.knowledgeNode.findMany({
      where: {
        userId,
        id: { not: excludeNodeId },
        explanation: { not: null },
        NOT: { explanation: "" },
      },
      select: {
        id: true,
        explanation: true,
      },
    });

    return rows.flatMap((row) => {
      if (row.explanation === null || row.explanation.trim().length === 0) {
        return [];
      }

      return [{ id: row.id, explanation: row.explanation }];
    });
  }

  async linkExists(
    sourceNodeId: string,
    targetNodeId: string,
    linkType: LinkType,
    userId: string,
    db: DbExecutor = this.db,
  ): Promise<boolean> {
    const row = await db.nodeLink.findFirst({
      where: {
        sourceNodeId,
        targetNodeId,
        linkType,
        userId,
      },
      select: { id: true },
    });

    return row !== null;
  }

  async listParentChildEdgesByUserId(
    userId: string,
    db: DbExecutor = this.db,
  ): Promise<readonly ParentChildTreeEdge[]> {
    const rows = await db.nodeLink.findMany({
      where: {
        userId,
        linkType: "parent",
      },
      select: parentChildTreeEdgeSelect,
    });

    return rows.flatMap((row) => {
      const edge = mapParentChildTreeEdge(row);
      return edge === null ? [] : [edge];
    });
  }

  async create(
    input: CreateNodeLinkInput,
    userId: string,
    db: DbExecutor = this.db,
  ): Promise<NodeLinkRecord> {
    const row = await db.nodeLink.create({
      data: {
        sourceNodeId: input.sourceNodeId,
        targetNodeId: input.targetNodeId,
        linkType: input.linkType,
        userId,
      },
      select: nodeLinkSelect,
    });

    return mapNodeLink(row);
  }
}
