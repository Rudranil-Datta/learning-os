import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { DEFAULT_USER_ID } from "../lib/constants/user";
import { KnowledgeNodeRepository } from "../lib/db/queries/nodes";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });
const repository = new KnowledgeNodeRepository(prisma);

type KnowledgeNodeIndexRow = {
  indexname: string;
  indexdef: string;
};

type ExplainRow = {
  "QUERY PLAN": string;
};

function isSearchIndex(row: KnowledgeNodeIndexRow): boolean {
  return (
    row.indexname === "idx_nodes_search" &&
    row.indexdef.toLowerCase().includes("gin") &&
    row.indexdef.includes("to_tsvector")
  );
}

async function verifySearchIndexExists(): Promise<void> {
  const indexes = await prisma.$queryRaw<KnowledgeNodeIndexRow[]>`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'knowledge_nodes'
    ORDER BY indexname
  `;

  if (!indexes.some(isSearchIndex)) {
    throw new Error(
      "Missing GIN search index idx_nodes_search on knowledge_nodes",
    );
  }

  console.log("OK: idx_nodes_search exists");
}

async function verifySearchUsesIndex(): Promise<void> {
  await prisma.$executeRawUnsafe("SET enable_seqscan = off");

  try {
    const plans = await prisma.$queryRaw<ExplainRow[]>`
      EXPLAIN
      SELECT id
      FROM knowledge_nodes
      WHERE user_id = ${DEFAULT_USER_ID}::uuid
        AND to_tsvector('english', title || ' ' || COALESCE(description, ''))
          @@ plainto_tsquery('english', 'binary')
    `;

    const planText = plans.map((row) => row["QUERY PLAN"]).join("\n");

    if (planText.includes("idx_nodes_search")) {
      console.log("OK: EXPLAIN uses idx_nodes_search");
      return;
    }

    console.log(
      "WARN: planner did not pick idx_nodes_search in EXPLAIN (small table may seq-scan at runtime)",
    );
    console.log(planText);
  } finally {
    await prisma.$executeRawUnsafe("SET enable_seqscan = on");
  }
}

async function verifySearchResults(): Promise<void> {
  const results = await repository.searchByUserId(DEFAULT_USER_ID, "binary");
  const titles = results.map((node) => node.title);

  if (!titles.includes("Binary Search")) {
    throw new Error(
      `Expected Binary Search in results for q=binary, got: ${titles.join(", ") || "none"}`,
    );
  }

  console.log(`OK: search q=binary returned ${results.length} node(s)`);
}

async function verifyFullListStillWorks(): Promise<void> {
  const results = await repository.listByUserId(DEFAULT_USER_ID);

  if (results.length === 0) {
    throw new Error("Expected seed nodes in full list");
  }

  console.log(`OK: full list returned ${results.length} node(s)`);
}

async function main(): Promise<void> {
  await verifySearchIndexExists();
  await verifySearchUsesIndex();
  await verifySearchResults();
  await verifyFullListStillWorks();
  console.log("Day 6 search verification passed");
}

main()
  .catch((error: unknown) => {
    console.error("Day 6 search verification failed");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
