import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { DEFAULT_USER_EMAIL, DEFAULT_USER_ID } from "../lib/constants/user";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const SAMPLE_NODES = [
  {
    title: "Binary Search",
    description: "Search sorted array by halving the search space each step.",
    explanation:
      "Compare target with middle element. Go left or right. O(log n) time.",
  },
  {
    title: "Divide and Conquer",
    description: "Break problem into smaller subproblems, solve, then combine.",
    explanation: "Used by merge sort, quicksort, and binary search.",
  },
  {
    title: "Recursion",
    description: "Function calls itself on smaller inputs until base case.",
  },
  {
    title: "Hash Tables",
    description: "Key-value store with average O(1) lookup using hashing.",
  },
  {
    title: "Dynamic Programming",
    description: "Solve overlapping subproblems with memoization or tabulation.",
  },
  {
    title: "Graph Traversal",
    description: "Visit nodes in a graph using BFS or DFS.",
  },
  {
    title: "Big O Notation",
    description: "Describes upper bound of algorithm time or space growth.",
  },
  {
    title: "Linked Lists",
    description: "Linear collection of nodes connected by pointers.",
  },
] as const;

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { id: DEFAULT_USER_ID },
    update: { email: DEFAULT_USER_EMAIL },
    create: {
      id: DEFAULT_USER_ID,
      email: DEFAULT_USER_EMAIL,
    },
  });

  for (const node of SAMPLE_NODES) {
    await prisma.knowledgeNode.upsert({
      where: {
        title_userId: {
          title: node.title,
          userId: DEFAULT_USER_ID,
        },
      },
      update: {
        description: node.description,
        explanation: "explanation" in node ? node.explanation : null,
      },
      create: {
        title: node.title,
        description: node.description,
        explanation: "explanation" in node ? node.explanation : null,
        userId: DEFAULT_USER_ID,
      },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
