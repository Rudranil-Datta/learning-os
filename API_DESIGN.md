---
alwaysApply: true
---

| Method | Endpoint | Description |
|---------|---------|---------|
| GET | `/api/chat` | Load main chat history. Optional `?conversationId=`. Returns `{ conversationId, messages[] }` with pending `suggestedNodes` on the last assistant message. Without `conversationId`, uses the latest main conversation. |
| POST | `/api/chat` | Main chat endpoint. Accepts `{ message, conversationId? }`. Returns answer and suggested nodes (pending confirmation). Sets conversation title from first user message when empty. |

| GET | `/api/conversations` | List main chat conversations (`context_node_id` null), sorted by recent activity. Returns `{ conversations: [{ id, title, updatedAt }] }`. |
| POST | `/api/conversations` | Create a new empty main chat conversation. Returns `{ id, title, updatedAt }` (title starts as `"New chat"`). |

| POST | `/api/sidechat` | Side-panel chat endpoint. Accepts `{ message, conversationId?, contextNodeId }`. The `contextNodeId` must reference an existing node. |

| GET | `/api/nodes` | List nodes with optional full-text search using `?q=`. Pagination optional. |

| GET | `/api/nodes/:id` | Retrieve node details along with parent, child, and related links. |

| POST | `/api/nodes` | Create a new node manually. |

| PUT | `/api/nodes/:id` | Update an existing node. |

| DELETE | `/api/nodes/:id` | Delete a node and cascade-delete associated links. |

| POST | `/api/nodes/:id/links` | Create a link between nodes. Accepts `{ targetNodeId, linkType }`. |

| GET | `/api/nodes/tree` | Return the parent-child hierarchy as a nested structure for knowledge tree visualization. |

| POST | `/api/nodes/suggestions/confirm` | Confirm one or more suggested nodes. Accepts `{ suggestionIds }` and creates confirmed nodes. |

| DELETE | `/api/nodes/suggestions/:suggestionId` | Reject/remove a suggested node before confirmation. |
