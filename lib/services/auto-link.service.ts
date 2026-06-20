import type { Prisma, PrismaClient } from "@/app/generated/prisma/client";

import { DEFAULT_USER_ID } from "@/lib/constants/user";
import { LinkRepository } from "@/lib/db/queries/links";
import {
  AUTO_LINK_MAX_LINKS_PER_NODE,
  explanationMentionsTitle,
} from "@/lib/utils/auto-link";
import type { NodeLinkRecord } from "@/types/database";

type DbExecutor = PrismaClient | Prisma.TransactionClient;

export interface AutoLinkNewNodeInput {
  readonly id: string;
  readonly title: string;
}

export interface AutoLinkResult {
  readonly links: readonly NodeLinkRecord[];
}

export class AutoLinkService {
  constructor(
    private readonly linkRepository: LinkRepository,
    private readonly userId: string = DEFAULT_USER_ID,
  ) {}

  async createRelatedLinksForNode(
    node: AutoLinkNewNodeInput,
    db: DbExecutor,
  ): Promise<AutoLinkResult> {
    const candidates = await this.linkRepository.listExplanationCandidates(
      this.userId,
      node.id,
      db,
    );

    const links: NodeLinkRecord[] = [];

    for (const candidate of candidates) {
      if (links.length >= AUTO_LINK_MAX_LINKS_PER_NODE) {
        break;
      }

      if (!explanationMentionsTitle(candidate.explanation, node.title)) {
        continue;
      }

      const exists = await this.linkRepository.linkExists(
        candidate.id,
        node.id,
        "related",
        this.userId,
        db,
      );

      if (exists) {
        continue;
      }

      const link = await this.linkRepository.create(
        {
          sourceNodeId: candidate.id,
          targetNodeId: node.id,
          linkType: "related",
        },
        this.userId,
        db,
      );

      links.push(link);
    }

    return { links };
  }
}
