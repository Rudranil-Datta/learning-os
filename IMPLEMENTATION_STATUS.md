# Current Phase

Phase 2 — Week 2 Main Chat (Day 11 complete)

# Current Task

Day 12 — Suggestion pills (confirm/dismiss) + confirm/reject API

# Day 11 — Task breakdown (complete)

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Chat API client (`sendMessage`, error typing) | `lib/api/chat-client.ts` | done |
| 2 | Message + read-only suggestion chip components | `components/ChatMessage.tsx`, `components/SuggestionChip.tsx` | done |
| 3 | Main chat UI (input, history, loading, errors) | `components/ChatInterface.tsx` | done |
| 4 | Dashboard shell: chat center + side panel placeholder | `app/(dashboard)/page.tsx`, `components/SidePanelPlaceholder.tsx`, `app/(dashboard)/layout.tsx` | done |
| 5 | Client state: messages, `conversationId`, send flow | `components/ChatInterface.tsx` | done |
| 6 | Browser smoke + milestone update | manual check, `IMPLEMENTATION_STATUS.md` | done |

## Definition of Done (Day 11)

- [x] `/` shows working main chat (send → answer → history grows)
- [x] `conversationId` reused across messages in session
- [x] Read-only suggestion chips under assistant reply (`title`; `id` available for Day 12)
- [x] Loading + error states; Send disabled while pending
- [x] Message bubbles (user right, assistant left); indigo accent on primary actions
- [x] Side panel placeholder on large screens (“Select a node to explore”) — no `/api/sidechat` yet
- [x] Grid layout ready for Week 3 side panel (`lg:grid-cols-3` or equivalent)
- [x] No confirm/dismiss pills, no confirm/reject API (Day 12)

## Smoke verification (Day 11)

- [x] `npm run build` passes
- [x] `npm run chat:test` passes (API + DB persistence)
- [x] Browser: `/` renders Main chat, Send, side panel placeholder, Chat/Nodes nav

## Accepted scope vs original roadmap

- **`UI_DESIGN.md`:** Dashboard split view + placeholder panel early; full side-panel chat stays Week 3 (Days 17–21)
- **`PROJECT_CONTEXT.md` Day 11:** Chat UI only — interactive suggestion pills deferred to Day 12
- **`/api/chat` route:** Already shipped Day 8 — Day 11 is client + UI only

# Day 10 — Task breakdown (complete)

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Prisma model + `SuggestionStatus` enum + migration | `prisma/schema.prisma`, `prisma/migrations/20260617155039_add_pending_node_suggestions/` | done |
| 2 | Domain types + status constants | `types/database.ts` | done |
| 3 | `SuggestionRepository.createMany` | `lib/db/queries/suggestions.ts` | done |
| 4 | Persist suggestions in chat flow (transaction with messages) | `lib/services/chat.service.ts`, `lib/db/queries/messages.ts`, `lib/api/error-handler.ts` | done |
| 5 | `id` on `SuggestedNodeResponse` | `types/api.ts` | done |
| 6 | `chat:test` DB persistence asserts | `scripts/test-chat.ts` | done |
| 7 | Milestone update | `IMPLEMENTATION_STATUS.md` | done |

## Definition of Done (Day 10)

- [x] `pending_node_suggestions` table matches `DATABASE_DESIGN.md` (columns + indexes)
- [x] `ChatService.sendMessage()` persists suggestions with `status='pending'`
- [x] Messages + suggestions saved atomically in one transaction
- [x] `POST /api/chat` returns `suggestedNodes` with `{ id, title, description }`
- [x] `npm run chat:test` passes and verifies DB rows
- [x] No confirm/reject routes yet (Day 12)
- [x] No chat UI yet (Day 11)

## Deferred from original Day 10 scope (accepted)

- **Suggestion pills UI** — Day 12
- **Confirm/reject API** — Day 12
- **Pending suggestion dedupe across chats** — optional; not required V1

# Day 9 — Task breakdown (complete)

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Extractor contract + Zod schema for LLM JSON | `types/database.ts`, `lib/validation/node-extractor.schema.ts` | done |
| 2 | `NodeExtractor` agent (prompt → `callOpenAI` → parse) | `lib/agents/nodeExtractor.ts` | done |
| 3 | Wire orchestrator → extractor after answer | `lib/agents/orchestrator.ts` | done |
| 4 | Pass `suggestedNodes` through service/API | `lib/services/chat.service.ts`, `types/api.ts`, `scripts/test-chat.ts` | done |
| 5 | Extractor test script | `scripts/test-extractor.ts`, `package.json` | done |
| 6 | Milestone update | `IMPLEMENTATION_STATUS.md` | done |

## Definition of Done (Day 9)

- [x] `NodeExtractor` returns validated `{ title, description }[]` from Q&A via `callOpenAI()`
- [x] Zod parse + empty array on bad JSON (no throw)
- [x] Filters duplicates against `existingNodeTitles`
- [x] `MainChatOrchestrator` invokes extractor after answer
- [x] `POST /api/chat` returns non-empty `suggestedNodes` when concepts present
- [x] `npm run extractor:test` and `npm run chat:test` pass
- [x] No `pending_node_suggestions` persistence yet (Day 10)
- [x] No chat UI / confirm-reject endpoints yet (Day 11–12)

## Deferred from original Day 9 dataflow (accepted)

- **`pending_node_suggestions` DB save** — Day 10
- **Suggestion pills UI** — Day 12
- **Confirm/reject API** — Day 12

# Day 8 — Task breakdown (complete)

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Orchestrator contract + prompt shape | `lib/agents/orchestrator.ts`, `types/api.ts` | done |
| 2 | Conversation/message repository layer | `lib/db/queries/conversations.ts`, `lib/db/queries/messages.ts` | done |
| 3 | Chat service wrapper (orchestrator + repos) | `lib/services/chat.service.ts` | done |
| 4 | `POST /api/chat` route + validation | `app/api/chat/route.ts`, `lib/validation/chat.schema.ts`, `lib/api/error-handler.ts` | done |
| 5 | Milestone update | `IMPLEMENTATION_STATUS.md` | done |

## Definition of Done (Day 8)

- [x] `MainChatOrchestrator` searches nodes, builds prompt (top 5), calls `callOpenAI()`
- [x] `ConversationRepository` + `MessageRepository` (get/create main conv, save msgs, recent history)
- [x] `ChatService.sendMessage()` — Route → Service → Repository → orchestrator
- [x] `POST /api/chat` validates body, returns `{ answer, conversationId, suggestedNodes }`
- [x] Messages saved after successful LLM response (user + assistant)
- [x] `suggestedNodes` empty stub — Day 9 extractor + Day 10 persistence deferred
- [x] No chat UI, no `pending_node_suggestions` table, no NodeExtractor yet

## Deferred from original Day 8 dataflow (accepted)

- **NodeExtractor** — Day 9
- **`pending_node_suggestions` persistence** — Day 10
- **Chat UI** — Day 11
- **Auto-linking on confirm** — Day 13

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
- Dashboard layout + chat home at `app/(dashboard)/page.tsx`, nodes nav
- Day 4 browser verification (home → nodes, create, list refresh path, 409 duplicate)
- Day 5 index audit + sample seed + unique index verification
- Day 6 full-text search: GIN migration, search utils, repo/service/API, search UI
- Search verification script (`scripts/verify-search-index.ts`, `npm run db:verify-search`)
- Day 7 LLM layer: `LLMProvider`, OpenAI provider, `callOpenAI`, env factory, LLM errors
- `.env.example` + `npm run llm:test` (verified gpt-4o-mini connection)
- Day 8 main chat backend: orchestrator, conv/msg repos, `ChatService`, `POST /api/chat`
- Day 9 node extractor: `NodeExtractor`, orchestrator wiring, `suggestedNodes` in API, `extractor:test` + `chat:test`
- Day 10 suggestion persistence: `pending_node_suggestions` table, `SuggestionRepository`, transactional save in `ChatService`, `id` in API response, `chat:test` DB verification
- Day 11 chat UI: `chat-client`, `ChatInterface`, read-only suggestion chips, dashboard grid + side panel placeholder at `/`

# In Progress

- None

# Pending

- Day 12–14: Suggestion pills (confirm/dismiss), confirm/reject API, auto-link, e2e main chat
- Post–Day 6: `pg_trgm`, `websearch_to_tsquery`, pagination
- Week 3: knowledge tree + side panel
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
