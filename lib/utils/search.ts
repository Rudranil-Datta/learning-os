export const SEARCH_MIN_LENGTH = 1;
export const SEARCH_MAX_LENGTH = 200;

export const KNOWLEDGE_NODE_SEARCH_VECTOR_EXPRESSION =
  "to_tsvector('english', title || ' ' || COALESCE(description, ''))";

/**
 * Normalize user search input for plainto_tsquery.
 * Returns null when query too short after trim.
 */
export function normalizeSearchQuery(raw: string): string | null {
  const sanitized = raw
    .replace(/\0/g, "")
    .trim()
    .replace(/\s+/g, " ");

  if (sanitized.length < SEARCH_MIN_LENGTH) {
    return null;
  }

  if (sanitized.length > SEARCH_MAX_LENGTH) {
    return sanitized.slice(0, SEARCH_MAX_LENGTH);
  }

  return sanitized;
}

/**
 * PostgreSQL tsquery config for knowledge node full-text search (V1).
 * websearch_to_tsquery upgrade planned for later — same GIN index.
 */
export const KNOWLEDGE_NODE_TSQUERY_CONFIG = "english" as const;

export type KnowledgeNodeTsQueryConfig = typeof KNOWLEDGE_NODE_TSQUERY_CONFIG;
