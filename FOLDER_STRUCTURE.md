learning-os/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx                 # ChatShell: sidebar + main chat + side panel
│   │   ├── nodes/
│   │   │   ├── page.tsx             # Node list with search
│   │   │   ├── [id]/page.tsx        # Node detail + manual linking
│   │   │   └── tree/page.tsx        # Knowledge tree visualisation
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts             # GET history, POST send
│   │   ├── conversations/
│   │   │   └── route.ts             # GET list, POST create
│   │   ├── sidechat/
│   │   │   └── route.ts
│   │   ├── nodes/
│   │   │   ├── route.ts
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts
│   │   │   │   └── links/
│   │   │   │       └── route.ts
│   │   │   ├── tree/
│   │   │   │   └── route.ts
│   │   │   └── suggestions/
│   │   │       ├── confirm/
│   │   │       │   └── route.ts
│   │   │       └── [suggestionId]/
│   │   │           └── route.ts
│   │   └── ... (other routes)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ChatShell.tsx                # Sidebar + main chat orchestration
│   ├── ChatSidebar.tsx              # Chat history list + New chat
│   ├── ChatInterface.tsx            # Active conversation UI
│   ├── SidePanelPlaceholder.tsx
│   ├── ContextualSidePanel.tsx      # AI chat with node context (Week 3)
│   ├── KnowledgeTree.tsx            # Recursive collapsible tree
│   ├── NodeCard.tsx
│   ├── SuggestionChip.tsx           # Confirm/reject suggestion pills
├── lib/
│   ├── api/
│   │   ├── chat-client.ts
│   │   ├── conversations-client.ts
│   │   └── suggestions-client.ts
│   ├── constants/
│   │   └── chat-storage.ts          # localStorage key for selected chat
│   ├── agents/
│   │   ├── orchestrator.ts
│   │   ├── sideOrchestrator.ts
│   │   └── nodeExtractor.ts
│   ├── llm/
│   │   └── client.ts
│   ├── db/
│   │   ├── client.ts                # PostgreSQL pool
│   │   └── queries/
│   │       ├── nodes.ts
│   │       ├── links.ts
│   │       ├── conversations.ts
│   │       └── suggestions.ts
│   ├── services/
│   │   ├── chat.service.ts
│   │   ├── conversation.service.ts
│   │   ├── suggestion.service.ts
│   │   └── auto-link.service.ts
│   └── utils/
│       ├── search.ts                # Full‑text search helpers
│       └── deduplicate.ts           # Check existing node by title (unique index handles)
├── types/
│   ├── database.ts
│   └── api.ts
├── .env.local
├── next.config.js
├── package.json
└── tsconfig.json