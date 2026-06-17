import { NodeExtractor } from "@/lib/agents/nodeExtractor";
import { callOpenAI } from "@/lib/llm/client";
import type { KnowledgeNodeService } from "@/lib/services/knowledge-node.service";
import type { KnowledgeNodeRecord, SuggestedNodeDraft } from "@/types/database";
import type { ChatMessage } from "@/types/llm";

export const MAIN_CHAT_TOP_CONTEXT_NODES = 5;

export type { SuggestedNodeDraft };

export interface ExistingKnowledgeContext {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly explanation: string | null;
}

export interface MainChatOrchestratorInput {
  readonly message: string;
  readonly conversationId?: string;
  readonly history?: readonly ChatMessage[];
}

export interface MainChatOrchestratorResult {
  readonly answer: string;
  readonly conversationId: string | null;
  readonly suggestedNodes: readonly SuggestedNodeDraft[];
  readonly contextNodeIds: readonly string[];
}

export interface MainChatNodeLookup {
  searchNodes(query: string): Promise<readonly KnowledgeNodeRecord[]>;
}

type CompleteFn = typeof callOpenAI;

function toExistingKnowledgeContext(
  node: KnowledgeNodeRecord,
): ExistingKnowledgeContext {
  return {
    id: node.id,
    title: node.title,
    description: node.description,
    explanation: node.explanation,
  };
}

function formatExistingKnowledgeSection(
  nodes: readonly ExistingKnowledgeContext[],
): string {
  if (nodes.length === 0) {
    return "The user has no matching knowledge nodes in their library yet.";
  }

  const entries = nodes.map((node, index) => {
    const description = node.description?.trim() || "No short description.";
    const explanation = node.explanation?.trim();

    if (explanation) {
      return `${index + 1}. ${node.title}\n   Description: ${description}\n   Explanation: ${explanation}`;
    }

    return `${index + 1}. ${node.title}\n   Description: ${description}`;
  });

  return [
    "The user already has these relevant knowledge nodes:",
    ...entries,
  ].join("\n");
}

export function buildMainChatSystemPrompt(
  existingKnowledge: readonly ExistingKnowledgeContext[],
): string {
  const knowledgeSection = formatExistingKnowledgeSection(existingKnowledge);

  return [
    "You are Learning OS, a personal knowledge assistant.",
    "The user learns by chatting and saving concepts as knowledge nodes.",
    "Use the existing knowledge below when it helps answer the question.",
    "If existing knowledge is missing or incomplete, answer clearly from general knowledge.",
    "Do not invent node titles or claim nodes exist unless they appear below.",
    "",
    knowledgeSection,
  ].join("\n");
}

export function buildMainChatMessages(
  userMessage: string,
  existingKnowledge: readonly ExistingKnowledgeContext[],
  history: readonly ChatMessage[] = [],
): ChatMessage[] {
  const systemMessage: ChatMessage = {
    role: "system",
    content: buildMainChatSystemPrompt(existingKnowledge),
  };

  const recentHistory = history.filter(
    (message) => message.role === "user" || message.role === "assistant",
  );

  const userTurn: ChatMessage = {
    role: "user",
    content: userMessage,
  };

  return [systemMessage, ...recentHistory, userTurn];
}

export function createNodeLookupFromService(
  service: KnowledgeNodeService,
): MainChatNodeLookup {
  return {
    searchNodes: (query: string) => service.listNodes(query),
  };
}

export class MainChatOrchestrator {
  private readonly nodeExtractor: NodeExtractor;

  constructor(
    private readonly nodeLookup: MainChatNodeLookup,
    private readonly complete: CompleteFn = callOpenAI,
    nodeExtractor?: NodeExtractor,
  ) {
    this.nodeExtractor = nodeExtractor ?? new NodeExtractor(complete);
  }

  async run(input: MainChatOrchestratorInput): Promise<MainChatOrchestratorResult> {
    const matchedNodes = await this.nodeLookup.searchNodes(input.message);
    const contextNodes = matchedNodes
      .slice(0, MAIN_CHAT_TOP_CONTEXT_NODES)
      .map(toExistingKnowledgeContext);

    const messages = buildMainChatMessages(
      input.message,
      contextNodes,
      input.history,
    );

    const llmResult = await this.complete(messages);

    const extraction = await this.nodeExtractor.extract({
      question: input.message,
      answer: llmResult.content,
      existingNodeTitles: matchedNodes.map((node) => node.title),
    });

    return {
      answer: llmResult.content,
      conversationId: input.conversationId ?? null,
      suggestedNodes: extraction.suggestions,
      contextNodeIds: contextNodes.map((node) => node.id),
    };
  }
}
