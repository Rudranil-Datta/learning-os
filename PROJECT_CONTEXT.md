# LearningOS – Project Context for Coding Agent

## The Vision

LearningOS is not a chatbot. It is a **personal knowledge operating system** where every learning concept becomes a permanent **Knowledge Node**. You talk to the system. It extracts what matters. It builds your knowledge tree. And it lets you explore any concept through a side panel that remembers what you discussed about that concept.

Chats are temporary. Nodes are forever.

## The Core Workflow (V1)

1. **Chat** – You ask a question. The AI answers.
2. **Knowledge Extraction** – From the answer, the AI suggests new Knowledge Nodes (concepts, terms, ideas). You confirm which ones to save.
3. **Knowledge Nodes** – Each node stores a title, description, deeper explanation, and connections (parent, child, related).
4. **Knowledge Tree** – Nodes are organised into a hierarchy. You can see how “Binary Search” relates to “Divide and Conquer”.
5. **Contextual Side‑Panel AI Chat** – Click any node. A side panel opens where you can chat *about that node*. The panel knows the node’s explanation and keeps its own conversation history. It’s like having a tutor dedicated to one topic.

## V1 Requirements (What Must Work)

- Single user (no login – hardcoded for now, but ready for multiple users later).
- Main chat interface.
- After each AI answer, show suggested nodes as “pills”. User clicks to confirm or reject.
- Manually create nodes via a form.
- Edit node details (title, description, explanation).
- Link nodes as “parent”, “child”, or “related”.
- View a knowledge tree (visual hierarchy of parent‑child links).
- Click any node → open side panel that chats with that node’s context.
- Side panel remembers conversation history per node (even after page reload).
- Full‑text search over node titles and descriptions.

## V1 Features (Detailed)

### Main Chat
- User types a message.
- System searches existing nodes (by title/description) to provide context.
- AI answers using GPT‑4o-mini.
- After answer, a separate AI call extracts suggested nodes (title + short description).
- Suggestions appear as buttons. Confirmed nodes are saved into the database.

### Knowledge Nodes
- Required: `title` (unique per user).
- Optional: `description`, `explanation`, `summary`, `metadata` (JSON).
- Nodes are the central entity – everything revolves around them.

### Knowledge Tree
- Built from parent‑child links.
- A node can have many children.
- Rendered as a collapsible nested list. (No graph database needed – simple recursive query.)

### Contextual Side‑Panel Chat
- Triggered by clicking any node (from tree, search, or node detail page).
- The side panel creates or reuses a conversation linked to that node.
- The AI is given the node’s explanation and its related nodes as background.
- The panel shows a chat history scoped to that node.
- Questions asked there stay in that context (e.g., “What is the time complexity?” knows you’re asking about “Binary Search”).

### Node Linking (Manual)
- From a node detail page, search for another node.
- Choose link type: `parent`, `child`, `related`.
- Links are stored in a separate table.

### Search
- Simple text search on `title` and `description` (using PostgreSQL `ILIKE` or `tsvector` for V1).

## What V1 Does NOT Have (Yet)

- No PDF upload or document parsing.
- No vector embeddings or pgvector.
- No interview question generator.
- No auto‑generated notes.
- No multi‑user authentication.
- No knowledge graph (only parent/child/related, not arbitrary semantic inference).
- No LangChain or LangGraph – plain functions.

## Technical Stack (Fixed)

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- PostgreSQL (Neon.tech) with pg_trgm extension
- OpenAI API (gpt-4o-mini)
- Deployed on Vercel

## Why This Story Matters

You are building a learning companion that **remembers what you learn** and **lets you drill into any concept with its own chat session**. The side panel is not static documentation – it is an AI tutor specialised in one node. The knowledge tree shows how ideas connect. Every chat interaction enriches your personal knowledge base.

This is placement‑worthy because it goes beyond a simple chatbot. It demonstrates understanding of persistent knowledge representation, contextual AI, and scalable architecture (even in V1).

## Guiding Principle for the Coding Agent

Always prioritise the **node‑first** mental model. When you implement a feature, ask: *Does this make Knowledge Nodes more useful? Does it help the user build their tree? Does it respect the side panel’s per‑node memory?*

Avoid adding complexity that does not directly serve the core workflow: Chat → Extraction → Nodes → Tree → Contextual Side Chat.

We have a time contraint of 1 month, so that the project can be shown in portfolio. thats why we are just building the version 1 initially.

Implementation Roadmap (33 days)
Week 1 – Foundation (Days 1–7)
Day 1-2: Next.js + TS + Tailwind setup, Neon DB, run schema migration.

Day 3: DB client, basic CRUD for nodes (list, get, create, update, delete).

Day 4: Manual node creation UI + simple node list page.

Day 5: Add unique index and search index (test with sample data).

Day 6: Implement full‑text search API (/api/nodes?q=).

Day 7: Build llm/client.ts and test OpenAI connection.

Week 2 – Main Chat & Node Extraction (Days 8–14)
Day 8: Implement orchestrator.ts (search existing nodes, build prompt, call LLM).

Day 9: Implement nodeExtractor.ts (LLM call to extract suggestions as JSON).

Day 10: Create pending_node_suggestions table + save suggestions.

Day 11: Build /api/chat route and chat UI component.

Day 12: Display suggestion pills in UI, implement confirm/reject endpoints.

Day 13: Auto‑linking: when node confirmed, check appearances in other node explanations → create related links.

Day 14: Test main chat end‑to‑end, handle edge cases (no suggestions, duplicate titles caught by unique index).

Week 3 – Knowledge Tree & Side Panel (Days 15–21)
Day 15: Implement /api/nodes/tree (recursive query for parent‑child links).

Day 16: Build KnowledgeTree component (collapsible <ul>).

Day 17: Add node selection from tree → open side panel with context_node_id.

Day 18: Implement sideOrchestrator.ts – fetch node details + last 5 messages, build contextual prompt.

Day 19: Build /api/sidechat route and ContextualSidePanel component.

Day 20: Maintain side‑panel conversation history (store messages with context_node_id in conversations table).

Day 21: Test side panel: chat about a node, close/reopen, history persists.

Week 4 – Polish & Integration (Days 22–28)
Day 22: Improve UI: split view layout, responsive design.

Day 23: Add loading states, error boundaries, timeout handling (10s Vercel limit – use streaming if needed).

Day 24: Implement node deduplication on title (catch unique constraint violation and prompt user to link instead).

Day 25: Deploy to Vercel + Neon (set environment variables).

Day 26: Run manual test suite (see success criteria below).

Day 27: Write README and architecture summary for placement portfolio.

Day 28: Record demo video.

Week 5 – Buffer (Days 29–33)
Day 29-30: Fix bugs identified during testing.

Day 31: Enhance knowledge tree with drag‑to‑link? Not required – keep simple.

Day 32: Final polish: side panel keyboard shortcuts, node search from side panel.

Day 33: Freeze code, generate final documentation.

