# Current Phase

Phase 3 — **Week 3 Side Panel** (Day 19 done)

# Current Task

Day 20 — side-panel history reload on reopen

# Day 19 — Task breakdown (complete)

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Contracts + `SideChatRequest`/`SideChatResponse` | `types/api.ts` | done |
| 2 | Zod schema | `lib/validation/sidechat.schema.ts` | done |
| 3 | `NodeExtractor` on side path | `lib/agents/sideOrchestrator.ts` | done |
| 4 | `SideChatService` | `lib/services/side-chat.service.ts` | done |
| 5 | Factory + `POST /api/sidechat` | `error-handler.ts`, `app/api/sidechat/route.ts` | done |
| 6 | API client | `lib/api/sidechat-client.ts` | done |
| 7 | Panel send + pills + context link on confirm | `ContextualSidePanel.tsx`, `ChatShell.tsx`, confirm path | done |
| 8 | Tests + doc sync | `scripts/test-sidechat.ts`, `sidechat:test`, this file | done |

## Definition of Done (Day 19)

- [x] `POST /api/sidechat` returns `{ answer, conversationId, contextNodeId, suggestedNodes }`
- [x] Side orchestrator runs `NodeExtractor`; dedupes vs context + linked titles
- [x] User + assistant messages + pending suggestions persisted in side conversation
- [x] Panel: type → send → bubbles + suggestion pills in session
- [x] Confirm from panel passes `contextNodeId` → `related` link context → new node
- [x] `npm run sidechat:test` + `npm run build` pass
- [ ] History reload on reopen (Day 20)

## Smoke verification (Day 19)

- [x] `npm run sidechat:test` passes
- [x] `npm run side-orchestrator:test` passes
- [x] `npm run build` passes
- [ ] Browser: tree click → side chat send → confirm pill (manual)

## Accepted scope vs original roadmap

- **`NodeExtractor` on side path** — included (was optional in `DATAFLOW.md`)
- **Session-only UI history** — reload deferred Day 20
- **Confirm context link** — optional `contextNodeId` on confirm API (side panel only)

# Day 18 — Task breakdown (complete)

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Contracts + `SIDE_PANEL_HISTORY_LIMIT` | `lib/agents/sideOrchestrator.ts` | done |
| 2 | Node context shape + link summaries | `lib/agents/sideOrchestrator.ts` | done |
| 3 | Prompt builders | `lib/agents/sideOrchestrator.ts` | done |
| 4 | `SidePanelOrchestrator` class | `lib/agents/sideOrchestrator.ts` | done |
| 5 | Deps + factory | `sideOrchestrator.ts`, `error-handler.ts` | done |
| 6 | Tests | `scripts/test-side-orchestrator.ts`, `side-orchestrator:test` | done |
| 7 | Doc sync | `IMPLEMENTATION_STATUS.md` | done |
| 8 | Handoff sync | `CURRENT.md` | done |

## Definition of Done (Day 18)

- [x] `SidePanelOrchestrator.run()` returns answer + conversationId + contextNodeId
- [x] System prompt includes title, explanation, parent/child/related links
- [x] Last 5 messages in prompt when present
- [x] `createSidePanelOrchestratorDeps` + `createSidePanelOrchestrator()` wired
- [x] `npm run side-orchestrator:test` passes (prompt + stub + factory DB)
- [x] `npm run build` passes
- [x] No `/api/sidechat`, no UI send, no message persistence (Day 19–20)

## Smoke verification (Day 18)

- [x] `npm run side-orchestrator:test` passes
- [x] `npm run build` passes

## Accepted scope vs original roadmap

- **Backend only** — orchestrator + factory; HTTP/UI deferred Day 19
- **No `NodeExtractor`** on side path — optional per `DATAFLOW.md`
- **History limit 5** — per `DATAFLOW.md` (main chat uses 10)

# Day 17 — Task breakdown (complete)

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Side conversation repo | `lib/db/queries/conversations.ts` | done |
| 2 | Service + `POST /api/conversations/side` | `conversation.service.ts`, `app/api/conversations/side/route.ts`, `conversation.schema.ts` | done |
| 3 | `ContextualSidePanel` shell | `components/ContextualSidePanel.tsx` | done |
| 4 | Tree + panel layout in `ChatShell` | `components/ChatShell.tsx` | done |
| 5 | Wire `onNodeSelect` → side session | `ChatShell.tsx`, `KnowledgeTree.tsx` | done |
| 6 | API clients | `conversations-client.ts`, `nodes-client.ts` | done |
| 7 | Tests | `scripts/test-side-conversation.ts`, `side-conversation:test` | done |
| 8 | Doc sync | `IMPLEMENTATION_STATUS.md`, `CURRENT.md` | done |

## Definition of Done (Day 17)

- [x] Tree click on `/` opens `ContextualSidePanel` with node title + explanation
- [x] `getOrCreateSideConversation` creates/reuses conv with `context_node_id`
- [x] Re-click same node → same `conversationId`
- [x] Main chat sidebar unchanged (main convs only)
- [x] Disabled chat input placeholder (Day 19)
- [x] `npm run build` + `side-conversation:test` pass

## Accepted scope vs original roadmap

- **No `/api/sidechat`** — Day 18–19
- **Right column** — tree top (~45%), panel bottom when node selected
- **`/nodes/tree` page** — still stub footer; full panel wire optional later

# Day 16 — Task breakdown (complete)

Revised scope: tree in dashboard right column beside chat; refetch on pill confirm.

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | `KnowledgeTree` collapsible component | `components/KnowledgeTree.tsx` | done |
| 2 | Embed tree in `ChatShell` (replace placeholder column) | `components/ChatShell.tsx` | done |
| 3 | Live update: confirm → bump `treeRefreshToken` | `components/ChatInterface.tsx`, `ChatShell.tsx` | done |
| 4 | `/nodes/tree` full-page view + Tree nav | `app/(dashboard)/nodes/tree/page.tsx`, `layout.tsx` | done |
| 5 | `onNodeSelect` stub (side panel Day 17) | `KnowledgeTree.tsx`, `ChatShell.tsx` | done |
| 6 | Manual smoke + doc sync | `IMPLEMENTATION_STATUS.md`, `CURRENT.md` | done |

## Definition of Done (Day 16)

- [x] Recursive `ul/li`, `▶` expand/collapse, child count badge, title hover
- [x] Tree visible beside main chat on `/` (xl+)
- [x] Confirm pill → tree refetches without page reload
- [x] `/nodes/tree` standalone page + nav link
- [x] `npm run build` passes
- [x] `tree:test` unchanged

## Smoke verification (Day 16)

- [x] `npm run build` passes (`/nodes/tree` route listed)
- [x] `npm run tree:test` passes
- [ ] Browser: tree on `/` xl+, confirm pill live update, `/nodes/tree` nav (manual)

## Accepted scope vs original roadmap

- **Tree on `/` right column** — not separate page only; `/nodes/tree` kept as full view
- **Side panel click** — `onNodeSelect` stub only; contextual chat = Day 17
- **Live update** — `refreshToken` from confirm, not cross-tab events

# Day 15 — Task breakdown (complete)

| # | Task | Script / files | Status |
|---|------|----------------|--------|
| 1 | Tree response types | `types/database.ts`, `types/api.ts` | done |
| 2 | Link repo: parent edges | `lib/db/queries/links.ts` | done |
| 3 | Tree builder util | `lib/utils/tree.ts` | done |
| 4 | `getKnowledgeTree()` service | `lib/services/knowledge-node.service.ts`, `lib/api/error-handler.ts` | done |
| 5 | `GET /api/nodes/tree` route | `app/api/nodes/tree/route.ts` | done |
| 6 | Factory wiring | `lib/api/error-handler.ts` | done |
| 7 | API client | `lib/api/nodes-client.ts` | done |
| 8 | Deterministic tests | `scripts/test-tree.ts`, `npm run tree:test` | done |
| 9 | Doc sync | `IMPLEMENTATION_STATUS.md`, `CURRENT.md` | done |

## Definition of Done (Day 15)

- [x] `GET /api/nodes/tree` → `{ tree: [{ id, title, children }] }`
- [x] Parent–child hierarchy only (`link_type='parent'`); `related` excluded
- [x] Orphans as roots; multi-parent first edge wins; cycle-safe build
- [x] `npm run tree:test` passes
- [x] `npm run build` passes
- [x] No UI changes (tree page + component = Day 16)

## Accepted scope vs original roadmap

- **Backend only** — `KnowledgeTree.tsx` / `/nodes/tree` deferred to Day 16
- **`child` link rows** — normalized in `lib/utils/tree.ts`; repo fetches `parent` edges only (matches `DATABASE_DESIGN.md`)
- **Manual link API** (`POST /api/nodes/:id/links`) still pending — tree test seeds links via repo

# Day 14 — Task breakdown (complete)

| # | Task | Script / files | Status |
|---|------|----------------|--------|
| 1 | Coverage audit vs existing scripts | audit in `CURRENT.md` | done |
| 2 | Deterministic edge tests (no LLM) | `npm run main-chat:edges:test` | done |
| 3 | E2E: conversations → chat → confirm/dismiss | `npm run main-chat:e2e:test` | done |
| 4 | Conversation API tests | `npm run conversations:test` | done |
| 5 | Fix gaps from audit | no bugs found | N/A |
| 6 | Manual browser checklist | `/` on port **3003** — API proxy verified; visual MCP blocked | done |
| 7 | Doc sync | `IMPLEMENTATION_STATUS.md`, `API_DESIGN.md` | done |

## Definition of Done (Day 14)

- [x] `npm run build` passes
- [x] `main-chat:edges:test`, `main-chat:e2e:test`, `conversations:test` pass
- [x] Existing `chat:test`, `suggestions:test`, `extractor:test` unchanged
- [x] Week 2 Main Chat marked complete

# Post–Day 13 UX enhancements (complete)

User-requested improvements beyond original Week 2 roadmap.

| # | Feature | Files | Status |
|---|---------|-------|--------|
| 1 | Load main chat history on mount / switch | `GET /api/chat`, `ChatService.getMainChatHistory`, `lib/api/chat-client.ts` | done |
| 2 | Multi-conversation sidebar (ChatGPT-style) | `ChatShell.tsx`, `ChatSidebar.tsx`, `app/(dashboard)/page.tsx` | done |
| 3 | List + create main conversations | `GET/POST /api/conversations`, `ConversationService`, `conversations-client.ts` | done |
| 4 | Auto-title chat from first user message | `ConversationRepository.updateTitle`, `ChatService.sendMessage` | done |
| 5 | Confirm success feedback + link to nodes | `ChatInterface.tsx` | done |
| 6 | Persist selected chat in browser | `lib/constants/chat-storage.ts` (`learning-os.mainConversationId`) | done |

## Definition of Done (UX enhancements)

- [x] Left sidebar lists past main chats; **New chat** creates empty conversation
- [x] Selecting a chat loads messages from DB; refresh restores last selected chat
- [x] Pending suggestion pills restore on last assistant message after reload
- [x] Confirm shows green “Saved … to your nodes” with link to `/nodes`
- [x] Mobile: conversation dropdown + New button (sidebar hidden on small screens)
- [x] Right panel remains Week 3 placeholder; confirmed nodes on `/nodes`

## Accepted scope vs original UI plan

- **Left sidebar = chat history** (not nodes list/tree — those stay in top nav)
- **Pending pills** not tied to specific message row in DB (attach to last assistant on reload)
- **No delete/rename** conversation in V1

# Day 13 — Task breakdown (complete)

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Link repository | `lib/db/queries/links.ts`, `types/database.ts` | done |
| 2 | Auto-link match + create `related` links | `lib/utils/auto-link.ts`, `lib/services/auto-link.service.ts` | done |
| 3 | Wire into confirm txn | `lib/services/suggestion.service.ts` | done |
| 4 | Factory wiring | `lib/api/error-handler.ts` | done |
| 5 | Extend `suggestions:test` | `scripts/test-suggestions.ts` | done |
| 6 | Milestone update | `IMPLEMENTATION_STATUS.md` | done |

## Definition of Done (Day 13)

- [x] Confirm → scan other nodes' **explanation** for new **title** (case-insensitive)
- [x] Match → create `related` link **existing → new** inside confirm txn
- [x] Skip self, duplicate links, titles shorter than 3 chars; cap 20 links per node
- [x] Zero matches → confirm still succeeds
- [x] No UI/API surface change; no tree refresh

## Smoke verification (Day 13)

- [x] `npm run build` passes
- [x] `npm run suggestions:test` passes (auto-link + existing confirm/reject paths)

## Accepted scope vs original roadmap

- **Explanation only** — not `description`
- **Required feature** for Day 13 (DATAFLOW "optional" = non-blocking, not skip)
- **Link direction:** existing node → confirmed node
- **Reject path:** delete pending row unchanged from Day 12

# Day 12 — Task breakdown (complete)

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Suggestion repo: find pending, delete | `lib/db/queries/suggestions.ts` | done |
| 2 | `SuggestionService` confirm + reject | `lib/services/suggestion.service.ts`, `lib/db/queries/nodes.ts` (tx on create) | done |
| 3 | Zod + API types (`suggestionIds`) | `lib/validation/suggestion.schema.ts`, `types/api.ts` | done |
| 4 | Confirm/reject routes + factory | `app/api/nodes/suggestions/confirm/route.ts`, `app/api/nodes/suggestions/[suggestionId]/route.ts`, `lib/api/error-handler.ts` | done |
| 5 | Suggestions API client | `lib/api/suggestions-client.ts` | done |
| 6 | Interactive pills UI | `components/SuggestionChip.tsx`, `components/ChatInterface.tsx` | done |
| 7 | `suggestions:test` + milestone update | `scripts/test-suggestions.ts`, `package.json`, `IMPLEMENTATION_STATUS.md` | done |

## Definition of Done (Day 12)

- [x] Confirm pill → `POST /api/nodes/suggestions/confirm` with `{ suggestionIds }` → node in DB, pending row removed, pill gone
- [x] Dismiss pill → `DELETE /api/nodes/suggestions/:suggestionId` → pending cleared, pill gone
- [x] 409 duplicate title surfaced in chat error alert
- [x] Per-pill loading; one suggestion action at a time
- [x] Green confirm / red dismiss per `UI_DESIGN.md`
- [x] No auto-link (Day 13), no tree refresh

## Smoke verification (Day 12)

- [x] `npm run build` passes
- [x] `npm run suggestions:test` passes (confirm, reject, duplicate title conflict)
- [ ] Browser: confirm + dismiss pills on `/` (manual)

## Accepted scope vs original roadmap

- **`API_DESIGN.md`:** confirm body uses `suggestionIds` (not `nodeIds`)
- **Reject:** delete pending row (not `rejected` status audit)
- **Per-pill confirm** (not batch UI); API still accepts array
- **`SuggestionChip.tsx`** kept (not renamed to `SuggestionPills.tsx`)
- **Auto-link on confirm** — Day 13

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
- Day 12 suggestion confirm/reject: `SuggestionService`, confirm/reject API routes, `suggestions-client`, interactive pills, `suggestions:test`
- Day 13 auto-link on confirm: `LinkRepository`, `AutoLinkService`, wired in confirm txn, extended `suggestions:test`
- Post–Day 13 UX: `GET /api/chat` history, `GET/POST /api/conversations`, `ChatShell`/`ChatSidebar`, confirm success banner, conversation auto-title
- Day 15 knowledge tree API: tree types, `LinkRepository.listParentChildEdgesByUserId`, `buildKnowledgeTree`, `GET /api/nodes/tree`, `nodes-client.getKnowledgeTree`, `tree:test`
- Day 16 knowledge tree UI: `KnowledgeTree`, embedded in `ChatShell`, live refetch on confirm, `/nodes/tree` page, Tree nav, `onNodeSelect` stub
- Day 17 side panel shell: `getOrCreateSideConversation`, `POST /api/conversations/side`, `ContextualSidePanel`, tree+panel `ChatShell` layout, `side-conversation:test`
- Day 18 side orchestrator: `SidePanelOrchestrator`, prompt builders, `createSidePanelOrchestrator`, `side-orchestrator:test`
- Day 19 side chat: `SideChatService`, `POST /api/sidechat`, `sidechat-client`, panel send + pills, context link on confirm, `sidechat:test`

# In Progress

- None

# Pending

- Post–Day 6: `pg_trgm`, `websearch_to_tsquery`, pagination
- Week 3 remainder: side-panel history reload + E2E (Days 20–21)
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
