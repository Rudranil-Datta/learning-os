import { Prisma } from "@/app/generated/prisma/client";
import { DEFAULT_USER_ID } from "@/lib/constants/user";
import { KnowledgeNodeRepository } from "@/lib/db/queries/nodes";
import { ConflictError, NotFoundError } from "@/lib/errors/app-error";
import type {
  CreateKnowledgeNodeInput,
  KnowledgeNodeRecord,
  KnowledgeNodeWithLinks,
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
    private readonly userId: string = DEFAULT_USER_ID,
  ) {}

  async listNodes(): Promise<readonly KnowledgeNodeRecord[]> {
    return this.repository.listByUserId(this.userId);
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
