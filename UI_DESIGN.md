# LearningOS V1 – UI Design Concept

## Overview

The UI follows a **node‑first** mental model. Everything revolves around knowledge nodes, but the entry point is chat. The layout is clean, minimal, and focused on two primary zones: the main chat (centre) and the contextual side panel (right), with navigation for the knowledge tree and node management.

**Design principles:**
- **Chat as the starting point** – the main conversation drives node creation.
- **Tree as the map** – shows how concepts connect.
- **Side panel as depth** – each node has its own AI chat session.
- **No clutter** – only features relevant to V1 are visible.

---

## Pages / Layouts

### 1. Dashboard (Default View)
- **Layout:** Three zones — **chat history sidebar (left)**, **main chat (centre)**, **contextual side panel (right, xl+)**.
- **Left sidebar:** List of past main chats (ChatGPT-style). **New chat** button at top. Click a chat to switch. Titles from first user message (or `"New chat"` until first send).
- **Centre:** Active conversation — messages, input, suggestion pills.
- **Right:** Contextual side panel placeholder (“Select a node to explore”) — Week 3 side-panel chat.

**Mobile:** Left sidebar hidden; conversation picker dropdown + **New** at top of main chat.

**When side panel is closed / narrow viewport:** Chat history sidebar + main chat fill the width.

---

### 2. Chat Interface (Centre)
- **Top:** Header showing **conversation title** (e.g. truncated first message).
- **Scrollable message area:** User messages (right‑aligned) and assistant messages (left‑aligned). **History loaded from DB** when selecting a chat or on page refresh.
- **Message composition:** Text input at the bottom with a Send button.
- **Suggestion pills:** After each assistant message, a horizontal row of chip buttons appears below the answer – each representing a suggested node. User can click to confirm (green ✓) or dismiss (red ✕). On confirm: green success banner **“Saved … to your nodes”** with link to `/nodes`.
- **Loading states:** “Loading conversation…” on switch; typing indicator while waiting for AI response.

---

### 3. Contextual Side Panel (Right)
- **Header:** Shows the current node’s title and a dropdown to switch to another node (or a “close” button).
- **Chat history:** Scrollable area with messages scoped to this node session.
- **Input:** Similar to main chat, but the AI is always aware of the node.
- **Background context:** A small badge or note indicating “You are discussing: [Node Title]” – optionally with a summary of the node’s explanation.
- **When first opened:** It loads the node’s explanation and shows a welcome message like “Ask me anything about [Node]”.

---

### 4. Node List & Search
- **Accessed via a top‑nav link or sidebar toggle.**
- **Search bar:** Full‑text search over node titles and descriptions.
- **Results:** Cards or list items showing node title, description, and a link to view details.
- **Action:** Clicking a node opens its detail page (or directly opens the side panel with that node as context – your choice; we’ll do both).

---

### 5. Node Detail Page
- **Displays:** Title, description, explanation, summary, metadata.
- **Relationships:** Lists of parents, children, and related nodes (clickable).
- **Actions:**
  - Edit node (opens inline form).
  - Add link (search for target node and choose link type).
  - Open in side panel (button that opens the side panel with this node).
- **Breadcrumb:** Shows path in the tree (optional).

---

### 6. Knowledge Tree
- **Accessed via a separate page or a modal overlay.**
- **Visual representation:** Collapsible nested list (using `ul`/`li`) – each node is clickable.
- **Interaction:** Click a node → opens the side panel with that node as context.
- **Node badges:** Show number of children.
- **Future enhancement:** Drag‑to‑link (not in V1).

---

## Key Components & Interactions

### Suggestion Pills
- Appear below the assistant message.
- Each pill: `[Confirm ✓] [Title] [Dismiss ✕]`
- Confirm → node saved, pill disappears, node appears in tree.
- Dismiss → pill disappears (not saved).
- If multiple suggestions, they appear horizontally (wrap on small screens).

### Knowledge Tree Component
- Recursive `ul/li`.
- Each node item: `▶` to expand/collapse children, node title.
- Clicking the title opens the side panel.
- Lazy loading? Not needed for V1 (fetch full tree initially, with max depth ~5).

### Side Panel Toggle
- A floating button or a tab in the right column to open/close.
- When open, main chat content shrinks (responsive).
- Side panel remembers its state per node – if you close and reopen, the conversation persists.

### Node Link Creation
- On node detail page, an “Add Link” button.
- A search field appears; user types part of a node title, selects target.
- Dropdown to choose link type (parent/child/related).
- Submit → creates `node_link`.

---

## User Flows (Step‑by‑Step)

### Flow 1: Main Chat → Node Creation
1. User types “Explain binary search” in main chat.
2. AI answers with a thorough explanation.
3. Below the answer, two suggestion pills appear: “Binary Search” and “Divide and Conquer”.
4. User clicks Confirm on “Binary Search”. Node is saved.
5. User clicks Dismiss on “Divide and Conquer” – it disappears.
6. The user can now see “Binary Search” in the node list and tree.

### Flow 2: Open Side Panel from Tree
1. User navigates to Knowledge Tree page.
2. Sees “Binary Search” under “Algorithms”.
3. Clicks on “Binary Search”.
4. Side panel slides in from the right, showing “You are discussing: Binary Search” and a chat input.
5. User types “What is the time complexity?”
6. AI responds using the node’s explanation and previous context.
7. User closes side panel; later reopens it and the conversation is still there.

### Flow 3: Manual Node Linking
1. User opens “Binary Search” node detail.
2. Clicks “Add Link”.
3. Searches for “Sorted Array”.
4. Selects “Sorted Array” and chooses link type “parent”.
5. Now “Sorted Array” appears as a parent in the tree.

---

## Visual Design (Tailwind CSS)
- **Color palette:** Neutral background (slate/gray), with an accent colour (blue or indigo) for interactive elements.
- **Typography:** Sans‑serif (Inter or system).
- **Cards:** Light shadow, rounded corners.
- **Messages:** Bubbles with subtle background (user = blue‑100, assistant = gray‑100).
- **Pills:** Green confirm button, red dismiss button.
- **Side panel:** White background, subtle border on the left.
- **Tree:** Indent with hover effect on node titles.

Responsive: On mobile, chat history uses a dropdown; side panel hidden until Week 3; tree page remains a separate view.

---

## Implemented layout (post–Day 13)

```
┌──────────────┬─────────────────────────┬─────────────────┐
│ Chat history │ Main chat               │ Node explorer   │
│ (sidebar)    │ (messages + input)      │ (placeholder)   │
│ New chat     │                         │                 │
│ · Chat 1     │                         │                 │
│ · Chat 2     │                         │                 │
└──────────────┴─────────────────────────┴─────────────────┘
```

Nodes list: top nav **Nodes** → `/nodes` (not the left sidebar).

---

## Implementation Notes for Coding Agent

- Use React Server Components where possible, but chat and side panel need client components (interactivity).
- **`ChatShell`** owns selected conversation id, sidebar list, and **New chat**; **`ChatInterface`** receives `conversationId` as prop.
- Selected conversation id persisted in `localStorage` (`learning-os.mainConversationId`).
- Use Tailwind classes directly – no custom CSS unless necessary.
- Main dashboard: full-width flex — sidebar `md+`, main chat flex-1, side panel `xl+`.
- Keep side panel as a separate component that receives `nodeId` as prop (Week 3).

This UI design aligns with the V1 requirements and provides a clean, focused experience that highlights the core workflow.