6. Agent Architecture (Simple, No Additional Agents)
V1 uses plain TypeScript functions, not LangChain. Only these agents:

| Agent | File | Responsibility |
|---------|---------|---------|
| Orchestrator | `lib/agents/orchestrator.ts` | Main chat flow: retrieve existing nodes (full-text search), build prompt, call LLM, invoke NodeExtractor, handle suggestions. |

| SidePanelOrchestrator | `lib/agents/sideOrchestrator.ts` | Similar to Orchestrator but injects `context_node` explanation and links into the prompt. Uses conversation history from the `messages` table. |

| NodeExtractor | `lib/agents/nodeExtractor.ts` | Takes LLM answer + question, returns a JSON array of suggested nodes (`{ title, description }`). Does **not** auto-create nodes. |

| LLM Client | `lib/llm/client.ts` | Single function `callOpenAI(messages, options)` that isolates the OpenAI dependency. |