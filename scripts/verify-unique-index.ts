import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma } from "../app/generated/prisma/client";
import { PrismaClient } from "../app/generated/prisma/client";
import { DEFAULT_USER_ID } from "../lib/constants/user";

const DUPLICATE_TITLE = "Binary Search";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

type KnowledgeNodeIndexRow = {
  indexname: string;
  indexdef: string;
};

function isUniqueTitleUserIndex(row: KnowledgeNodeIndexRow): boolean {
  return (
    row.indexname === "idx_nodes_title_user" &&
    row.indexdef.toLowerCase().includes("unique") &&
    row.indexdef.includes("title") &&
    row.indexdef.includes("user_id")
  );
}

async function verifyUniqueIndexExists(): Promise<void> {
  const indexes = await prisma.$queryRaw<KnowledgeNodeIndexRow[]>`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'knowledge_nodes'
    ORDER BY indexname
  `;

  const hasUniqueTitleUser = indexes.some(isUniqueTitleUserIndex);

  if (!hasUniqueTitleUser) {
    throw new Error("Missing unique index idx_nodes_title_user on (title, user_id)");
  }

  console.log("OK: idx_nodes_title_user exists");
  console.log(
    indexes.map((row) => `  - ${row.indexname}`).join("\n"),
  );
}

async function verifyDuplicateInsertBlocked(): Promise<void> {
  try {
    await prisma.knowledgeNode.create({
      data: {
        title: DUPLICATE_TITLE,
        description: "Duplicate probe",
        userId: DEFAULT_USER_ID,
      },
    });

    throw new Error("Duplicate insert succeeded but should have failed");
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      console.log("OK: duplicate (title, user_id) blocked with P2002");
      return;
    }

    throw error;
  }
}

async function main(): Promise<void> {
  await verifyUniqueIndexExists();
  await verifyDuplicateInsertBlocked();
  console.log("Day 5 unique index verification passed");
}

main()
  .catch((error: unknown) => {
    console.error("Day 5 unique index verification failed");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
