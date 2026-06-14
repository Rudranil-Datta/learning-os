---
alwaysApply: true
---
Main Chat Flow
User submits message → POST /api/chat
         │
         ▼
Orchestrator
  1. Retrieve existing nodes matching keywords (full‑text search)
  2. Build system prompt with top 5 nodes as "existing knowledge"
  3. Call OpenAI → answer
  4. Call NodeExtractor on answer → array of suggested nodes
  5. Store suggested nodes in pending_node_suggestions (status='pending')
  6. Save conversation & assistant message
  7. Return { answer, suggestedNodes, conversationId }
         │
         ▼
Frontend displays answer + shows suggestion pills (user can confirm/reject)
         │
User confirms → POST /api/nodes/suggestions/confirm → creates knowledge_nodes
         │
         ▼
(Optionally) auto‑link: if new node's title appears in existing node explanation → create 'related' link






Contextual Side‑Panel Chat Flow
User selects a node (e.g., from tree or search) → frontend opens side panel
         │
         ▼
Frontend creates or loads conversation with context_node_id = selectedNodeId
         │
         ▼
User types question → POST /api/sidechat { message, conversationId, contextNodeId }
         │
         ▼
SidePanelOrchestrator
  1. Fetch node explanation, parents, children, related nodes
  2. Load last 5 messages from this conversation (chat history)
  3. Build prompt: "You are an expert on [node title]. [Explanation]. Related concepts: [list]. Chat history: [history]. User: [message]"
  4. Call OpenAI → answer
  5. (Optional) NodeExtractor runs but suggestions are tied to the context node (auto‑linked)
  6. Save message
  7. Return answer
         │
         ▼
Side panel displays answer, maintains scrollable history for that node session





Knowledge Tree Flow
GET /api/nodes/tree → returns nested structure:
  [
    { id, title, children: [ { id, title, children: [...] } ] }
  ]
         │
         ▼
Frontend renders collapsible tree (recursive <ul> / <li>)
         │
User clicks node → side panel opens with that node as context