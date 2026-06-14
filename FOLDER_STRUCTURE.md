learning-os/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx                 # Main chat + side panel (split view)
│   │   ├── nodes/
│   │   │   ├── page.tsx             # Node list with search
│   │   │   ├── [id]/page.tsx        # Node detail + manual linking
│   │   │   └── tree/page.tsx        # Knowledge tree visualisation
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts
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
│   │   │       └── confirm/
│   │   │           └── route.ts
│   │   └── ... (other routes)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ChatInterface.tsx
│   ├── ContextualSidePanel.tsx      # AI chat with node context
│   ├── KnowledgeTree.tsx            # Recursive collapsible tree
│   ├── NodeCard.tsx
│   ├── SuggestionPills.tsx          # Confirm/reject node suggestions
├── lib/
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