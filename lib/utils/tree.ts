import type {
  KnowledgeTreeNode,
  LinkedNodeSummary,
  LinkType,
  ParentChildTreeEdge,
} from "@/types/database";

export interface TreeLinkInput {
  readonly linkType: LinkType;
  readonly sourceNode: LinkedNodeSummary;
  readonly targetNode: LinkedNodeSummary;
}

function edgeKey(edge: ParentChildTreeEdge): string {
  return `${edge.parentId}:${edge.childId}`;
}

function dedupeParentChildEdges(
  edges: readonly ParentChildTreeEdge[],
): ParentChildTreeEdge[] {
  const seen = new Set<string>();
  const deduped: ParentChildTreeEdge[] = [];

  for (const edge of edges) {
    const key = edgeKey(edge);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(edge);
  }

  return deduped;
}

/** Normalize parent/child link rows to parent→child edges. Skips related. */
export function normalizeTreeLinks(
  links: readonly TreeLinkInput[],
): readonly ParentChildTreeEdge[] {
  const edges: ParentChildTreeEdge[] = [];

  for (const link of links) {
    if (link.linkType === "related") {
      continue;
    }

    edges.push({
      parentId: link.sourceNode.id,
      parentTitle: link.sourceNode.title,
      childId: link.targetNode.id,
      childTitle: link.targetNode.title,
    });
  }

  return dedupeParentChildEdges(edges);
}

function buildTitleMap(
  edges: readonly ParentChildTreeEdge[],
  allNodes: readonly LinkedNodeSummary[],
): Map<string, string> {
  const titles = new Map<string, string>();

  for (const node of allNodes) {
    titles.set(node.id, node.title);
  }

  for (const edge of edges) {
    titles.set(edge.parentId, edge.parentTitle);
    titles.set(edge.childId, edge.childTitle);
  }

  return titles;
}

function assignFirstParentPerChild(
  edges: readonly ParentChildTreeEdge[],
): Map<string, string> {
  const childToParent = new Map<string, string>();

  for (const edge of edges) {
    if (!childToParent.has(edge.childId)) {
      childToParent.set(edge.childId, edge.parentId);
    }
  }

  return childToParent;
}

function buildChildrenByParent(
  edges: readonly ParentChildTreeEdge[],
  childToParent: ReadonlyMap<string, string>,
): Map<string, LinkedNodeSummary[]> {
  const childrenByParent = new Map<string, LinkedNodeSummary[]>();
  const seenChildUnderParent = new Map<string, Set<string>>();

  for (const edge of edges) {
    if (childToParent.get(edge.childId) !== edge.parentId) {
      continue;
    }

    let seen = seenChildUnderParent.get(edge.parentId);

    if (seen === undefined) {
      seen = new Set<string>();
      seenChildUnderParent.set(edge.parentId, seen);
    }

    if (seen.has(edge.childId)) {
      continue;
    }

    seen.add(edge.childId);

    const siblings = childrenByParent.get(edge.parentId) ?? [];
    siblings.push({ id: edge.childId, title: edge.childTitle });
    childrenByParent.set(edge.parentId, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort((a, b) => a.title.localeCompare(b.title));
  }

  return childrenByParent;
}

function buildTreeNode(
  nodeId: string,
  title: string,
  childrenByParent: ReadonlyMap<string, readonly LinkedNodeSummary[]>,
  ancestors: ReadonlySet<string>,
): KnowledgeTreeNode {
  if (ancestors.has(nodeId)) {
    return { id: nodeId, title, children: [] };
  }

  const nextAncestors = new Set(ancestors);
  nextAncestors.add(nodeId);

  const children = (childrenByParent.get(nodeId) ?? []).map((child) =>
    buildTreeNode(child.id, child.title, childrenByParent, nextAncestors),
  );

  return { id: nodeId, title, children };
}

/**
 * Build nested tree from parent→child edges.
 * Orphan nodes (no parent edge) become roots. Multiple parents: first edge wins.
 */
export function buildKnowledgeTree(
  edges: readonly ParentChildTreeEdge[],
  allNodes: readonly LinkedNodeSummary[],
): readonly KnowledgeTreeNode[] {
  const dedupedEdges = dedupeParentChildEdges(edges);
  const titles = buildTitleMap(dedupedEdges, allNodes);
  const childToParent = assignFirstParentPerChild(dedupedEdges);
  const childrenByParent = buildChildrenByParent(dedupedEdges, childToParent);

  const rootIds = new Set<string>();

  for (const node of allNodes) {
    if (!childToParent.has(node.id)) {
      rootIds.add(node.id);
    }
  }

  for (const edge of dedupedEdges) {
    if (!childToParent.has(edge.parentId)) {
      rootIds.add(edge.parentId);
    }
  }

  const sortedRootIds = [...rootIds].sort((a, b) => {
    const titleA = titles.get(a) ?? "";
    const titleB = titles.get(b) ?? "";
    return titleA.localeCompare(titleB);
  });

  return sortedRootIds.map((rootId) => {
    const title = titles.get(rootId) ?? rootId;
    return buildTreeNode(rootId, title, childrenByParent, new Set());
  });
}
