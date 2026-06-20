import "dotenv/config";

import { createKnowledgeNodeService } from "../lib/api/error-handler";
import { DEFAULT_USER_ID } from "../lib/constants/user";
import { prisma } from "../lib/db/client";
import { LinkRepository } from "../lib/db/queries/links";
import { KnowledgeNodeRepository } from "../lib/db/queries/nodes";
import { isAppError } from "../lib/errors/app-error";
import { buildKnowledgeTree, normalizeTreeLinks } from "../lib/utils/tree";
import type { KnowledgeTreeNode } from "../types/database";

function findInTree(
  tree: readonly KnowledgeTreeNode[],
  title: string,
): KnowledgeTreeNode | undefined {
  for (const node of tree) {
    if (node.title === title) {
      return node;
    }

    const nested = findInTree(node.children, title);

    if (nested !== undefined) {
      return nested;
    }
  }

  return undefined;
}

function isRoot(tree: readonly KnowledgeTreeNode[], title: string): boolean {
  return tree.some((node) => node.title === title);
}

function assertEmptyTree(): void {
  const tree = buildKnowledgeTree([], []);

  if (tree.length !== 0) {
    throw new Error("Expected empty tree for no nodes and no edges");
  }

  console.log("OK: empty tree");
}

function assertNestedHierarchy(): void {
  const nodes = [
    { id: "root", title: "Algorithms" },
    { id: "child", title: "Binary Search" },
  ];
  const edges = [
    {
      parentId: "root",
      parentTitle: "Algorithms",
      childId: "child",
      childTitle: "Binary Search",
    },
  ];

  const tree = buildKnowledgeTree(edges, nodes);

  if (!isRoot(tree, "Algorithms")) {
    throw new Error("Expected Algorithms as root");
  }

  const root = findInTree(tree, "Algorithms");

  if (root === undefined || root.children.length !== 1) {
    throw new Error("Expected one child under Algorithms");
  }

  if (root.children[0].title !== "Binary Search") {
    throw new Error("Expected Binary Search under Algorithms");
  }

  if (isRoot(tree, "Binary Search")) {
    throw new Error("Binary Search should not be a root");
  }

  console.log("OK: nested hierarchy");
}

function assertOrphanRoots(): void {
  const nodes = [
    { id: "a", title: "Alpha" },
    { id: "b", title: "Beta" },
  ];

  const tree = buildKnowledgeTree([], nodes);

  if (tree.length !== 2) {
    throw new Error("Expected two orphan roots");
  }

  if (!isRoot(tree, "Alpha") || !isRoot(tree, "Beta")) {
    throw new Error("Orphan nodes should appear as roots");
  }

  console.log("OK: orphan nodes as roots");
}

function assertMultiParentFirstEdgeWins(): void {
  const nodes = [
    { id: "p1", title: "Parent One" },
    { id: "p2", title: "Parent Two" },
    { id: "c", title: "Shared Child" },
  ];
  const edges = [
    {
      parentId: "p1",
      parentTitle: "Parent One",
      childId: "c",
      childTitle: "Shared Child",
    },
    {
      parentId: "p2",
      parentTitle: "Parent Two",
      childId: "c",
      childTitle: "Shared Child",
    },
  ];

  const tree = buildKnowledgeTree(edges, nodes);
  const underFirst = findInTree(tree, "Parent One");
  const underSecond = findInTree(tree, "Parent Two");

  if (underFirst === undefined || findInTree(underFirst.children, "Shared Child") === undefined) {
    throw new Error("Shared child should appear under first parent");
  }

  if (
    underSecond !== undefined &&
    findInTree(underSecond.children, "Shared Child") !== undefined
  ) {
    throw new Error("Shared child should not appear under second parent");
  }

  console.log("OK: multi-parent first edge wins");
}

function assertCycleDoesNotRecurseForever(): void {
  const nodes = [
    { id: "a", title: "Node A" },
    { id: "b", title: "Node B" },
  ];
  const edges = [
    {
      parentId: "a",
      parentTitle: "Node A",
      childId: "b",
      childTitle: "Node B",
    },
    {
      parentId: "b",
      parentTitle: "Node B",
      childId: "a",
      childTitle: "Node A",
    },
  ];

  const tree = buildKnowledgeTree(edges, nodes);

  if (tree.length !== 0) {
    const countNodes = (nodes: readonly KnowledgeTreeNode[]): number =>
      nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);

    if (countNodes(tree) > 2) {
      throw new Error("Cycle produced runaway tree growth");
    }
  }

  console.log("OK: cycle handled without runaway growth");
}

function assertNormalizeChildLink(): void {
  const edges = normalizeTreeLinks([
    {
      linkType: "child",
      sourceNode: { id: "p", title: "Parent" },
      targetNode: { id: "c", title: "Child" },
    },
    {
      linkType: "related",
      sourceNode: { id: "x", title: "X" },
      targetNode: { id: "y", title: "Y" },
    },
  ]);

  if (edges.length !== 1) {
    throw new Error("Expected one normalized edge");
  }

  if (edges[0].parentId !== "p" || edges[0].childId !== "c") {
    throw new Error("Child link should normalize to parent→child");
  }

  console.log("OK: normalize child link");
}

async function assertServiceTreeFromDatabase(suffix: string): Promise<void> {
  const nodeRepository = new KnowledgeNodeRepository(prisma);
  const linkRepository = new LinkRepository(prisma);
  const service = createKnowledgeNodeService();

  const parent = await nodeRepository.create(
    { title: `Tree Parent ${suffix}` },
    DEFAULT_USER_ID,
  );
  const child = await nodeRepository.create(
    { title: `Tree Child ${suffix}` },
    DEFAULT_USER_ID,
  );
  const orphan = await nodeRepository.create(
    { title: `Tree Orphan ${suffix}` },
    DEFAULT_USER_ID,
  );

  await linkRepository.create(
    {
      sourceNodeId: parent.id,
      targetNodeId: child.id,
      linkType: "parent",
    },
    DEFAULT_USER_ID,
  );

  const tree = await service.getKnowledgeTree();
  const parentNode = findInTree(tree, parent.title);
  const childNode = findInTree(tree, child.title);
  const orphanNode = findInTree(tree, orphan.title);

  if (parentNode === undefined) {
    throw new Error("Seeded parent missing from service tree");
  }

  if (findInTree(parentNode.children, child.title) === undefined) {
    throw new Error("Seeded child missing under parent in service tree");
  }

  if (childNode === undefined) {
    throw new Error("Seeded child missing from service tree");
  }

  if (!isRoot(tree, orphan.title) || orphanNode?.children.length !== 0) {
    throw new Error("Seeded orphan should be root with no children");
  }

  console.log("OK: service getKnowledgeTree from database");
}

async function cleanupSeededNodes(suffix: string): Promise<void> {
  await prisma.knowledgeNode.deleteMany({
    where: {
      userId: DEFAULT_USER_ID,
      title: { contains: suffix },
    },
  });
}

async function main(): Promise<void> {
  assertEmptyTree();
  assertNestedHierarchy();
  assertOrphanRoots();
  assertMultiParentFirstEdgeWins();
  assertCycleDoesNotRecurseForever();
  assertNormalizeChildLink();

  const suffix = crypto.randomUUID();

  try {
    await assertServiceTreeFromDatabase(suffix);
  } finally {
    await cleanupSeededNodes(suffix);
  }

  console.log("OK: Knowledge tree tests passed");
}

main()
  .catch((error: unknown) => {
    console.error("Tree test failed");

    if (isAppError(error)) {
      console.error(`${error.name}: ${error.message}`);
      if (error.details !== undefined) {
        console.error(error.details);
      }
    } else if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
