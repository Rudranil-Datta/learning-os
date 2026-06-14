# LearningOS V1 – Database Design

## Overview

PostgreSQL database with `pg_trgm` extension for similarity search.  
Single hardcoded user (`user_id = '00000000-0000-0000-0000-000000000001'`) but all tables include `user_id` for future multi‑user.

---

## Tables

### users
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Default `gen_random_uuid()` |
| `email` | TEXT UNIQUE | User email |

**Note:** V1 inserts one row.

---

### knowledge_nodes (core entity)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Default `gen_random_uuid()` |
| `title` | TEXT NOT NULL | Node name, e.g. "Binary Search" |
| `description` | TEXT | Short definition |
| `explanation` | TEXT | Detailed explanation (can be long) |
| `summary` | TEXT | Concise summary |
| `metadata` | JSONB | Extensible fields (difficulty, tags, etc.) |
| `user_id` | UUID NOT NULL | References `users(id)`. Default hardcoded user |
| `created_at` | TIMESTAMPTZ | Default `now()` |
| `updated_at` | TIMESTAMPTZ | Default `now()` |

**Indexes:**
- `UNIQUE (title, user_id)` – prevents duplicate titles per user
- `GIN to_tsvector('english', title || ' ' || COALESCE(description, ''))` – full‑text search

---

### node_links
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Default `gen_random_uuid()` |
| `source_node_id` | UUID NOT NULL | References `knowledge_nodes(id)` |
| `target_node_id` | UUID NOT NULL | References `knowledge_nodes(id)` |
| `link_type` | TEXT NOT NULL | One of: `parent`, `child`, `related` |
| `user_id` | UUID NOT NULL | Default hardcoded user |
| `created_at` | TIMESTAMPTZ | Default `now()` |

**Constraints:**
- `UNIQUE (source_node_id, target_node_id, link_type)`
- `CHECK (link_type IN ('parent','child','related'))`

**Note:** A `parent` link from A→B means A is parent of B. For tree queries, we follow `link_type='parent'` edges.

---

### conversations
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Default `gen_random_uuid()` |
| `user_id` | UUID NOT NULL | Default hardcoded user |
| `context_node_id` | UUID NULL | References `knowledge_nodes(id)`. NULL = main chat, otherwise side‑panel chat for that node |
| `title` | TEXT | Auto‑generated from first message (optional) |
| `created_at` | TIMESTAMPTZ | Default `now()` |

**Indexes:** `(user_id)`, `(context_node_id)`

---

### messages
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Default `gen_random_uuid()` |
| `conversation_id` | UUID NOT NULL | References `conversations(id)` ON DELETE CASCADE |
| `role` | TEXT NOT NULL | `user` or `assistant` |
| `content` | TEXT NOT NULL | Message text |
| `created_at` | TIMESTAMPTZ | Default `now()` |

**Index:** `(conversation_id)`

---

### pending_node_suggestions
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Default `gen_random_uuid()` |
| `user_id` | UUID NOT NULL | Default hardcoded user |
| `conversation_id` | UUID NOT NULL | Which chat generated the suggestion |
| `title` | TEXT NOT NULL | Suggested node name |
| `description` | TEXT | Suggested description |
| `status` | TEXT | `pending`, `confirmed`, `rejected` (default `pending`) |
| `created_at` | TIMESTAMPTZ | Default `now()` |

**Indexes:** `(user_id, status)`, `(conversation_id)`

**Purpose:** Temporary storage until user confirms/rejects. After confirmation, row deleted and node created in `knowledge_nodes`. After rejection, row deleted or marked `rejected` for audit.

---

## Entity Relationship Diagram (Text)






## Key Relationships

- A `knowledge_node` can have many outgoing/incoming `node_links`.
- A `conversation` belongs to one `user` and optionally one `context_node_id` (the node being discussed).
- A `conversation` has many `messages`.
- A `conversation` may generate many `pending_node_suggestions`.

## Indexing Strategy for V1

| Purpose | Index |
|---------|-------|
| Unique node titles per user | `UNIQUE (title, user_id)` |
| Full‑text search on nodes | `GIN to_tsvector(title, description)` |
| Parent‑child tree traversal | `(source_node_id, link_type)` |
| Retrieve conversation messages | `(conversation_id)` |
| Find pending suggestions for user | `(user_id, status)` |

## Future Scaling Hooks (No Changes to V1)

- **Vector search (pgvector):** Add `embedding` column to `knowledge_nodes` and replace full‑text search.
- **Multi‑user auth:** Replace hardcoded `DEFAULT` on `user_id` with session value.
- **Knowledge graph:** Add more `link_type` values and inference logic – schema already supports arbitrary types.
- **PDF RAG:** New tables `documents`, `document_chunks` with `embedding` column.

This design is **normalised**, **indexed for V1 queries**, and **extensible** without schema rewrites.