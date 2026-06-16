-- Full-text search on title + description (V1)
-- Expression must match query in lib/utils/search.ts (Day 6)
CREATE INDEX "idx_nodes_search" ON "knowledge_nodes" USING GIN (
  to_tsvector('english', "title" || ' ' || COALESCE("description", ''))
);
