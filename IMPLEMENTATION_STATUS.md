# Current Phase

Phase 1 — Week 1 Foundation (Day 7 complete)

# Current Task

Day 8 — Main chat orchestrator (`lib/agents/orchestrator.ts`)

# Day 8 — Task breakdown (current day)

| # | Task | Files | Status |
|---|------|-------|--------|
| — | Plan Day 8 before implementation | — | pending |

# Day 7 — Task breakdown (complete)

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Add `openai` SDK + env docs | `package.json`, `.env.example` | done |
| 2 | LLM types | `types/llm.ts` | done |
| 3 | `LLMProvider` interface | `lib/llm/llm-provider.ts` | done |
| 4 | OpenAI-compatible provider (default gpt-4o-mini) | `lib/llm/providers/openai-provider.ts` | done |
| 5 | Provider factory from env | `lib/llm/create-llm-provider.ts` | done |
| 6 | `callOpenAI` facade (uses provider) | `lib/llm/client.ts` | done |
| 7 | LLM errors | `lib/errors/llm-error.ts` | done |
| 8 | Connection test script | `scripts/test-llm.ts`, `npm run llm:test` | done |
| 9 | Verify + update this file | — | done |

## Definition of Done (Day 7)

- [x] `LLMProvider` interface defined
- [x] OpenAI-compatible provider works with `gpt-4o-mini` default
- [x] `callOpenAI()` uses provider; SDK only in `lib/llm/providers/`
- [x] Env: `OPENAI_API_KEY` required; optional `OPENAI_MODEL`, `OPENAI_BASE_URL`, `LLM_PROVIDER`
- [x] `npm run llm:test` succeeds
- [x] DB/repository layer unchanged

# Completed

- Prisma setup
- Database schema + migration
- Project structure
- DB client (`lib/db/client.ts`)
- User constants (`lib/constants/user.ts`)
- Error hierarchy (`lib/errors/app-error.ts`)
- Domain + API types (`types/database.ts`, `types/api.ts`)
- Zod validation (`lib/validation/knowledge-node.schema.ts`)
- Knowledge Node repository (`lib/db/queries/nodes.ts`)
- Knowledge Node service (`lib/services/knowledge-node.service.ts`)
- Knowledge Node API routes (`/api/nodes`, `/api/nodes/[id]`)
- API error handler (`lib/api/error-handler.ts`)
- Day 3 CRUD smoke tests (list, get, create, update, delete, validation, conflict)
- Nodes API client (`lib/api/nodes-client.ts`)
- `NodeCard`, `CreateNodeForm`, `NodeList`, `NodeSearch` components
- Nodes page (`app/(dashboard)/nodes/page.tsx`)
- Dashboard layout + home nav (`app/(dashboard)/layout.tsx`, `app/page.tsx`)
- Day 4 browser verification (home → nodes, create, list refresh path, 409 duplicate)
- Day 5 index audit + sample seed + unique index verification
- Day 6 full-text search: GIN migration, search utils, repo/service/API, search UI
- Search verification script (`scripts/verify-search-index.ts`, `npm run db:verify-search`)
- Day 7 LLM layer: `LLMProvider`, OpenAI provider, `callOpenAI`, env factory, LLM errors
- `.env.example` + `npm run llm:test` (verified gpt-4o-mini connection)

# In Progress

- None

# Pending

- Day 8: Main chat orchestrator
- Post–Day 6: `pg_trgm`, `websearch_to_tsquery`, pagination
- Week 3: `node_links` tree index
- Later: Gemini provider, LangChain (only if RAG/multi-agent needed)

# Definition of Done (Day 6)

- [x] GIN search index `idx_nodes_search` exists
- [x] `GET /api/nodes?q=binary` returns matching seed nodes
- [x] `GET /api/nodes` (no `q`) returns full list
- [x] Search scoped to `DEFAULT_USER_ID`
- [x] Verification script passes (index exists + functional search)
- [x] Search UI on `/nodes` with debounced input
- [x] No pagination, no `websearch_to_tsquery`, no `pg_trgm`, no orchestrator

# Day 6 Plan — Full-Text Search (complete)

## Task breakdown

| # | Task | Status |
|---|------|--------|
| 1 | GIN `tsvector` migration | done |
| 2 | Search helpers | done |
| 3 | Repository `searchByUserId` | done |
| 4 | Service list/search branch | done |
| 5 | Zod for `?q=` | done |
| 6 | Wire `GET /api/nodes?q=` | done |
| 7 | Verify index + API smoke tests | done |
| 8 | Search UI | done |
| 9 | Update this file | done |

## Deferred to later days

- **Pagination** — `?limit` / `?offset` when list grows
- **`websearch_to_tsquery`** — extend `lib/utils/search.ts`
- **`pg_trgm`** — after basic `tsvector` search proven
- **Orchestrator search reuse** — Day 8+

# Definition of Done (Day 5)

- [x] Unique `(title, user_id)` verified at DB level
- [x] Sample seed nodes for search tests
- [x] `tsvector` deferred to Day 6 (vertical slice)

# Definition of Done (Day 4)

- [x] `/nodes` shows node list from API
- [x] Form creates node and list refreshes
- [x] Duplicate title returns 409
- [x] No edit or detail page
