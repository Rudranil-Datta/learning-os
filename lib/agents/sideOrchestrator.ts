import { NodeExtractor } from "@/lib/agents/nodeExtractor";
import { callOpenAI } from "@/lib/llm/client";
import type { MessageRepository } from "@/lib/db/queries/messages";
import type { KnowledgeNodeService } from "@/lib/services/knowledge-node.service";
import type {
  KnowledgeNodeWithLinks,
  LinkedNodeSummary,
  NodeLinksGrouped,
  SuggestedNodeDraft,
} from "@/types/database";
import type { ChatMessage } from "@/types/llm";

export const SIDE_PANEL_HISTORY_LIMIT = 5;

/** Context node + grouped links for side-panel prompts. */
export interface SidePanelNodeContext {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly explanation: string | null;
  readonly links: NodeLinksGrouped;
}

export interface SidePanelOrchestratorInput {
  readonly message: string;
  readonly conversationId: string;
  readonly contextNodeId: string;
  /** Optional overrides for tests; production loads via deps. */
  readonly node?: SidePanelNodeContext;
  readonly history?: readonly ChatMessage[];
}

export interface SidePanelOrchestratorResult {
  readonly answer: string;
  readonly conversationId: string;
  readonly contextNodeId: string;
  readonly suggestedNodes: readonly SuggestedNodeDraft[];
}

export interface SidePanelOrchestratorDeps {
  getNodeContext(contextNodeId: string): Promise<SidePanelNodeContext>;
  getRecentHistory(
    conversationId: string,
    limit?: number,
  ): Promise<readonly ChatMessage[]>;
}

type CompleteFn = typeof callOpenAI;

export function collectSidePanelExistingNodeTitles(
  node: SidePanelNodeContext,
): readonly string[] {
  const titles = new Set<string>([node.title]);

  for (const linked of [
    ...node.links.parents,
    ...node.links.children,
    ...node.links.related,
  ]) {
    titles.add(linked.title);
  }

  return [...titles];
}

export function toSidePanelNodeContext(
  node: KnowledgeNodeWithLinks,
): SidePanelNodeContext {
  return {
    id: node.id,
    title: node.title,
    description: node.description,
    explanation: node.explanation,
    links: node.links,
  };
}

function formatLinkedNodeTitles(nodes: readonly LinkedNodeSummary[]): string {
  if (nodes.length === 0) {
    return "None";
  }

  return nodes.map((node) => node.title).join(", ");
}

export function formatSidePanelLinksSection(links: NodeLinksGrouped): string {
  return [
    `Parents: ${formatLinkedNodeTitles(links.parents)}`,
    `Children: ${formatLinkedNodeTitles(links.children)}`,
    `Related: ${formatLinkedNodeTitles(links.related)}`,
  ].join("\n");
}

export function formatSidePanelKnowledgeSection(
  node: SidePanelNodeContext,
): string {
  const explanation = node.explanation?.trim();
  const description = node.description?.trim();

  if (explanation) {
    return explanation;
  }

  if (description) {
    return description;
  }

  return "No detailed explanation saved for this node yet.";
}

export function buildSidePanelSystemPrompt(node: SidePanelNodeContext): string {
  const knowledgeSection = formatSidePanelKnowledgeSection(node);
  const linksSection = formatSidePanelLinksSection(node.links);

  return [
    `You are an expert tutor helping the user learn about "${node.title}".`,
    "Answer as a specialist on this concept only.",
    "Use the explanation and linked concepts below when they help.",
    "If context is thin, answer clearly without inventing saved node details.",
    "",
    "Concept explanation:",
    knowledgeSection,
    "",
    "Linked concepts:",
    linksSection,
  ].join("\n");
}

export function buildSidePanelMessages(
  userMessage: string,
  node: SidePanelNodeContext,
  history: readonly ChatMessage[] = [],
): ChatMessage[] {
  const systemMessage: ChatMessage = {
    role: "system",
    content: buildSidePanelSystemPrompt(node),
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

export function toSidePanelChatHistory(
  messages: readonly {
    readonly role: string;
    readonly content: string;
  }[],
): readonly ChatMessage[] {
  return messages
    .filter(
      (record) => record.role === "user" || record.role === "assistant",
    )
    .map((record) => ({
      role: record.role as "user" | "assistant",
      content: record.content,
    }));
}

export function createSidePanelOrchestratorDeps(
  knowledgeNodeService: KnowledgeNodeService,
  messageRepository: MessageRepository,
): SidePanelOrchestratorDeps {
  return {
    async getNodeContext(contextNodeId: string): Promise<SidePanelNodeContext> {
      const node = await knowledgeNodeService.getNodeById(contextNodeId);
      return toSidePanelNodeContext(node);
    },
    async getRecentHistory(
      conversationId: string,
      limit: number = SIDE_PANEL_HISTORY_LIMIT,
    ): Promise<readonly ChatMessage[]> {
      const messages = await messageRepository.listRecentByConversation(
        conversationId,
        limit,
      );

      return toSidePanelChatHistory(messages);
    },
  };
}

export class SidePanelOrchestrator {
  private readonly nodeExtractor: NodeExtractor;

  constructor(
    private readonly deps: SidePanelOrchestratorDeps,
    private readonly complete: CompleteFn = callOpenAI,
    nodeExtractor?: NodeExtractor,
  ) {
    this.nodeExtractor = nodeExtractor ?? new NodeExtractor(complete);
  }

  async run(
    input: SidePanelOrchestratorInput,
  ): Promise<SidePanelOrchestratorResult> {
    const node =
      input.node ?? (await this.deps.getNodeContext(input.contextNodeId));

    if (node.id !== input.contextNodeId) {
      throw new Error("Side panel node context id mismatch");
    }

    const history =
      input.history ??
      (await this.deps.getRecentHistory(
        input.conversationId,
        SIDE_PANEL_HISTORY_LIMIT,
      ));

    const messages = buildSidePanelMessages(input.message, node, history);
    const llmResult = await this.complete(messages);

    const extraction = await this.nodeExtractor.extract({
      question: input.message,
      answer: llmResult.content,
      existingNodeTitles: collectSidePanelExistingNodeTitles(node),
    });

    return {
      answer: llmResult.content,
      conversationId: input.conversationId,
      contextNodeId: input.contextNodeId,
      suggestedNodes: extraction.suggestions,
    };
  }
}
