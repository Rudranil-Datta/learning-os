import "dotenv/config";

import type { SidePanelNodeContext } from "../lib/agents/sideOrchestrator";
import {
  SidePanelOrchestrator,
  buildSidePanelMessages,
  buildSidePanelSystemPrompt,
  collectSidePanelExistingNodeTitles,
  createSidePanelOrchestratorDeps,
  formatSidePanelLinksSection,
} from "../lib/agents/sideOrchestrator";
import { NodeExtractor } from "../lib/agents/nodeExtractor";
import {
  createConversationService,
  createKnowledgeNodeService,
} from "../lib/api/error-handler";
import { DEFAULT_USER_ID } from "../lib/constants/user";
import { prisma } from "../lib/db/client";
import { MessageRepository } from "../lib/db/queries/messages";
import { isAppError } from "../lib/errors/app-error";
import type { CallOpenAIResult } from "../types/llm";

const SAMPLE_NODE: SidePanelNodeContext = {
  id: "00000000-0000-0000-0000-000000000010",
  title: "Binary Search",
  description: "Search sorted arrays efficiently.",
  explanation: "Binary search halves the search space each step.",
  links: {
    parents: [{ id: "p1", title: "Algorithms" }],
    children: [{ id: "c1", title: "Lower Bound" }],
    related: [{ id: "r1", title: "Divide and Conquer" }],
  },
};

function assertPromptIncludesNodeContext(): void {
  const prompt = buildSidePanelSystemPrompt(SAMPLE_NODE);

  if (!prompt.includes("Binary Search")) {
    throw new Error("System prompt missing node title");
  }

  if (!prompt.includes("Binary search halves the search space each step.")) {
    throw new Error("System prompt missing explanation");
  }

  if (!prompt.includes("Algorithms") || !prompt.includes("Lower Bound")) {
    throw new Error("System prompt missing linked concept titles");
  }

  console.log("OK: side panel system prompt includes node context");
}

function assertLinksSectionFormatting(): void {
  const section = formatSidePanelLinksSection(SAMPLE_NODE.links);

  if (!section.includes("Parents: Algorithms")) {
    throw new Error("Links section missing parents");
  }

  if (!section.includes("Children: Lower Bound")) {
    throw new Error("Links section missing children");
  }

  if (!section.includes("Related: Divide and Conquer")) {
    throw new Error("Links section missing related");
  }

  console.log("OK: links section formatting");
}

function assertMessagesIncludeHistory(): void {
  const messages = buildSidePanelMessages("What is time complexity?", SAMPLE_NODE, [
    { role: "user", content: "Earlier question" },
    { role: "assistant", content: "Earlier answer" },
  ]);

  if (messages.length !== 4) {
    throw new Error("Expected system + history + user messages");
  }

  if (messages[1].content !== "Earlier question") {
    throw new Error("History order incorrect");
  }

  if (messages[3].content !== "What is time complexity?") {
    throw new Error("Latest user message missing");
  }

  console.log("OK: side panel messages include history");
}

function assertExistingNodeTitlesIncludeContextAndLinks(): void {
  const titles = collectSidePanelExistingNodeTitles(SAMPLE_NODE);

  if (!titles.includes("Binary Search")) {
    throw new Error("Existing titles missing context node");
  }

  if (!titles.includes("Algorithms") || !titles.includes("Divide and Conquer")) {
    throw new Error("Existing titles missing linked nodes");
  }

  console.log("OK: existing node titles include context and links");
}

function createStubNodeExtractor(
  json: string,
): NodeExtractor {
  return new NodeExtractor(async () => ({
    content: json,
    model: "stub",
  }));
}

async function assertOrchestratorStubComplete(): Promise<void> {
  const orchestrator = new SidePanelOrchestrator(
    {
      getNodeContext: async () => SAMPLE_NODE,
      getRecentHistory: async () => [],
    },
    async () =>
      ({
        content: "O(log n) for binary search.",
        model: "stub",
      }) satisfies CallOpenAIResult,
    createStubNodeExtractor(
      '[{"title":"Interpolation Search","description":"Improve on binary search with interpolation."}]',
    ),
  );

  const result = await orchestrator.run({
    message: "What is the time complexity?",
    conversationId: "00000000-0000-0000-0000-000000000020",
    contextNodeId: SAMPLE_NODE.id,
  });

  if (result.answer !== "O(log n) for binary search.") {
    throw new Error("Stub orchestrator answer mismatch");
  }

  if (result.contextNodeId !== SAMPLE_NODE.id) {
    throw new Error("Stub orchestrator contextNodeId mismatch");
  }

  if (result.suggestedNodes.length !== 1) {
    throw new Error("Stub orchestrator suggestions missing");
  }

  if (result.suggestedNodes[0]?.title !== "Interpolation Search") {
    throw new Error("Stub orchestrator suggestion title mismatch");
  }

  console.log("OK: orchestrator stub complete with extractor");
}

async function assertFactoryLoadsNodeFromDatabase(): Promise<void> {
  const nodeService = createKnowledgeNodeService();
  const conversationService = createConversationService();
  const messageRepository = new MessageRepository(prisma);
  const suffix = crypto.randomUUID();
  const title = `Side Orchestrator Node ${suffix}`;

  const node = await nodeService.createNode({
    title,
    explanation: "Factory loader should return this explanation.",
  });

  const sideConversation = await conversationService.getOrCreateSideConversation(
    node.id,
  );

  const wiredOrchestrator = new SidePanelOrchestrator(
    createSidePanelOrchestratorDeps(nodeService, messageRepository),
    async (messages) => {
      const system = messages.find((message) => message.role === "system");

      if (system?.content.includes(title) !== true) {
        throw new Error("Factory deps failed to load node title into prompt");
      }

      if (
        system.content.includes("Factory loader should return this explanation.") !==
        true
      ) {
        throw new Error("Factory deps failed to load node explanation");
      }

      return {
        content: "Factory path OK",
        model: "stub",
      };
    },
    createStubNodeExtractor("[]"),
  );

  const result = await wiredOrchestrator.run({
    message: "Summarize this concept.",
    conversationId: sideConversation.id,
    contextNodeId: node.id,
  });

  if (result.answer !== "Factory path OK") {
    throw new Error("Factory orchestrator run failed");
  }

  console.log("OK: factory deps load node from database");

  await prisma.conversation.deleteMany({
    where: { id: sideConversation.id, userId: DEFAULT_USER_ID },
  });
  await prisma.knowledgeNode.deleteMany({
    where: { id: node.id, userId: DEFAULT_USER_ID },
  });
}

async function main(): Promise<void> {
  assertPromptIncludesNodeContext();
  assertLinksSectionFormatting();
  assertMessagesIncludeHistory();
  assertExistingNodeTitlesIncludeContextAndLinks();
  await assertOrchestratorStubComplete();
  await assertFactoryLoadsNodeFromDatabase();

  console.log("OK: Side orchestrator tests passed");
}

main()
  .catch((error: unknown) => {
    console.error("Side orchestrator test failed");

    if (isAppError(error)) {
      console.error(`${error.name}: ${error.message}`);
      if (error.details !== undefined) {
        console.error(error.details);
      }
    } else if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
