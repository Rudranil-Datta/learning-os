import { Prisma } from "@/app/generated/prisma/client";
import { DEFAULT_USER_ID } from "@/lib/constants/user";
import { LinkRepository } from "@/lib/db/queries/links";
import { KnowledgeNodeRepository } from "@/lib/db/queries/nodes";
import { ConflictError, NotFoundError } from "@/lib/errors/app-error";
import { normalizeSearchQuery } from "@/lib/utils/search";
import { buildKnowledgeTree } from "@/lib/utils/tree";
import type {
  CreateKnowledgeNodeInput,
  KnowledgeNodeRecord,
  KnowledgeNodeWithLinks,
  KnowledgeTreeNode,
  UpdateKnowledgeNodeInput,
} from "@/types/database";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export class KnowledgeNodeService {
  constructor(
    private readonly repository: KnowledgeNodeRepository,
    private readonly linkRepository: LinkRepository,
    private readonly userId: string = DEFAULT_USER_ID,
  ) {}

  async listNodes(searchQuery?: string): Promise<readonly KnowledgeNodeRecord[]> {
    if (searchQuery === undefined) {
      return this.repository.listByUserId(this.userId);
    }

    const normalizedQuery = normalizeSearchQuery(searchQuery);

    if (normalizedQuery === null) {
      return this.repository.listByUserId(this.userId);
    }

    return this.repository.searchByUserId(this.userId, normalizedQuery);
  }

  async getKnowledgeTree(): Promise<readonly KnowledgeTreeNode[]> {
    const [edges, nodes] = await Promise.all([
      this.linkRepository.listParentChildEdgesByUserId(this.userId),
      this.repository.listByUserId(this.userId),
    ]);

    const summaries = nodes.map((node) => ({
      id: node.id,
      title: node.title,
    }));

    return buildKnowledgeTree(edges, summaries);
  }

  async getNodeById(id: string): Promise<KnowledgeNodeWithLinks> {
    const node = await this.repository.findById(id, this.userId);

    if (!node) {
      throw new NotFoundError("Knowledge node not found");
    }

    return node;
  }

  async createNode(data: CreateKnowledgeNodeInput): Promise<KnowledgeNodeRecord> {
    try {
      return await this.repository.create(data, this.userId);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("A knowledge node with this title already exists");
      }

      throw error;
    }
  }

  async updateNode(
    id: string,
    data: UpdateKnowledgeNodeInput,
  ): Promise<KnowledgeNodeRecord> {
    try {
      const node = await this.repository.update(id, data, this.userId);

      if (!node) {
        throw new NotFoundError("Knowledge node not found");
      }

      return node;
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("A knowledge node with this title already exists");
      }

      throw error;
    }
  }

  async deleteNode(id: string): Promise<void> {
    const deleted = await this.repository.delete(id, this.userId);

    if (!deleted) {
      throw new NotFoundError("Knowledge node not found");
    }
  }
}
