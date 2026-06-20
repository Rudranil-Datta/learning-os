import "dotenv/config";

import type {
  SidePanelOrchestrator,
  SidePanelOrchestratorInput,
  SidePanelOrchestratorResult,
} from "../lib/agents/sideOrchestrator";
import {
  createKnowledgeNodeService,
  createSuggestionService,
} from "../lib/api/error-handler";
import { DEFAULT_USER_ID } from "../lib/constants/user";
import { prisma } from "../lib/db/client";
import { ConversationRepository } from "../lib/db/queries/conversations";
import { MessageRepository } from "../lib/db/queries/messages";
import { KnowledgeNodeRepository } from "../lib/db/queries/nodes";
import { SuggestionRepository } from "../lib/db/queries/suggestions";
import {
  NotFoundError,
  ValidationError,
  isAppError,
} from "../lib/errors/app-error";
import { SideChatService } from "../lib/services/side-chat.service";
import { sideChatRequestSchema } from "../lib/validation/sidechat.schema";
import { SUGGESTION_STATUS } from "../types/database";

function createStubSideOrchestrator(
  result: Pick<
    SidePanelOrchestratorResult,
    "answer" | "suggestedNodes" | "contextNodeId"
  >,
): SidePanelOrchestrator {
  return {
    run: async (
      input: SidePanelOrchestratorInput,
    ): Promise<SidePanelOrchestratorResult> => ({
      answer: result.answer,
      conversationId: input.conversationId,
      contextNodeId: result.contextNodeId,
      suggestedNodes: result.suggestedNodes,
    }),
  } as unknown as SidePanelOrchestrator;
}

function createTestSideChatService(
  orchestrator: SidePanelOrchestrator,
): SideChatService {
  const knowledgeNodeService = createKnowledgeNodeService();

  return new SideChatService(
    prisma,
    new ConversationRepository(prisma),
    new MessageRepository(prisma),
    new SuggestionRepository(prisma),
    new KnowledgeNodeRepository(prisma),
    knowledgeNodeService,
    DEFAULT_USER_ID,
    orchestrator,
  );
}

async function seedContextNode(): Promise<{ readonly id: string; readonly title: string }> {
  const nodeService = createKnowledgeNodeService();
  const suffix = crypto.randomUUID();

  const node = await nodeService.createNode({
    title: `Side Chat Node ${suffix}`,
    explanation: "Context node for side chat tests.",
  });

  return { id: node.id, title: node.title };
}

async function assertEmptyMessageRejected(): Promise<void> {
  const contextNode = await seedContextNode();
  const sideChatService = createTestSideChatService(
    createStubSideOrchestrator({
      answer: "unused",
      contextNodeId: contextNode.id,
      suggestedNodes: [],
    }),
  );

  try {
    await sideChatService.sendMessage({
      message: "   ",
      contextNodeId: contextNode.id,
    });
    throw new Error("Expected ValidationError for empty message");
  } catch (error: unknown) {
    if (!(error instanceof ValidationError)) {
      throw error;
    }
  }

  const parsed = sideChatRequestSchema.safeParse({
    message: "",
    contextNodeId: contextNode.id,
  });

  if (parsed.success) {
    throw new Error("sideChatRequestSchema should reject empty message");
  }

  await prisma.knowledgeNode.deleteMany({
    where: { id: contextNode.id, userId: DEFAULT_USER_ID },
  });

  console.log("OK: empty message rejected");
}

async function assertSendPersistsMessagesAndSuggestions(): Promise<void> {
  const contextNode = await seedContextNode();
  const sideChatService = createTestSideChatService(
    createStubSideOrchestrator({
      answer: "Deterministic side answer.",
      contextNodeId: contextNode.id,
      suggestedNodes: [
        {
          title: `Side Suggestion ${crypto.randomUUID()}`,
          description: "Extracted from side chat.",
        },
      ],
    }),
  );

  const result = await sideChatService.sendMessage({
    message: "Explain related ideas.",
    contextNodeId: contextNode.id,
  });

  if (result.answer !== "Deterministic side answer.") {
    throw new Error("Side chat answer mismatch");
  }

  if (result.contextNodeId !== contextNode.id) {
    throw new Error("Side chat contextNodeId mismatch");
  }

  if (result.suggestedNodes.length !== 1) {
    throw new Error("Expected one suggested node in response");
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId: result.conversationId,
    },
    orderBy: { createdAt: "asc" },
  });

  if (messages.length !== 2) {
    throw new Error("Expected user and assistant messages persisted");
  }

  const pending = await prisma.pendingNodeSuggestion.findMany({
    where: {
      conversationId: result.conversationId,
      userId: DEFAULT_USER_ID,
      status: SUGGESTION_STATUS.pending,
    },
  });

  if (pending.length !== 1) {
    throw new Error("Expected one pending suggestion persisted");
  }

  if (pending[0]?.id !== result.suggestedNodes[0]?.id) {
    throw new Error("Persisted suggestion id mismatch");
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: result.conversationId,
      userId: DEFAULT_USER_ID,
      contextNodeId: contextNode.id,
    },
  });

  if (conversation === null) {
    throw new Error("Side conversation missing context_node_id");
  }

  await prisma.pendingNodeSuggestion.deleteMany({
    where: { conversationId: result.conversationId, userId: DEFAULT_USER_ID },
  });
  await prisma.message.deleteMany({
    where: { conversationId: result.conversationId },
  });
  await prisma.conversation.deleteMany({
    where: { id: result.conversationId, userId: DEFAULT_USER_ID },
  });
  await prisma.knowledgeNode.deleteMany({
    where: { id: contextNode.id, userId: DEFAULT_USER_ID },
  });

  console.log("OK: side chat persists messages and suggestions");
}

async function assertConversationContextMismatchRejected(): Promise<void> {
  const contextNode = await seedContextNode();
  const otherNode = await seedContextNode();
  const sideChatService = createTestSideChatService(
    createStubSideOrchestrator({
      answer: "unused",
      contextNodeId: contextNode.id,
      suggestedNodes: [],
    }),
  );

  const first = await sideChatService.sendMessage({
    message: "First message",
    contextNodeId: contextNode.id,
  });

  try {
    await sideChatService.sendMessage({
      message: "Second message",
      conversationId: first.conversationId,
      contextNodeId: otherNode.id,
    });
    throw new Error("Expected NotFoundError for conversation mismatch");
  } catch (error: unknown) {
    if (!(error instanceof NotFoundError)) {
      throw error;
    }
  }

  await prisma.message.deleteMany({
    where: { conversationId: first.conversationId },
  });
  await prisma.conversation.deleteMany({
    where: { id: first.conversationId, userId: DEFAULT_USER_ID },
  });
  await prisma.knowledgeNode.deleteMany({
    where: {
      id: { in: [contextNode.id, otherNode.id] },
      userId: DEFAULT_USER_ID,
    },
  });

  console.log("OK: conversation context mismatch rejected");
}

async function assertConfirmLinksContextNode(): Promise<void> {
  const contextNode = await seedContextNode();
  const conversationRepository = new ConversationRepository(prisma);
  const suggestionRepository = new SuggestionRepository(prisma);
  const suggestionService = createSuggestionService();

  const conversation = await conversationRepository.getOrCreateSideConversation(
    contextNode.id,
    DEFAULT_USER_ID,
    contextNode.title,
  );

  const suggestions = await suggestionRepository.createMany([
    {
      userId: DEFAULT_USER_ID,
      conversationId: conversation.id,
      title: `Linked Side Concept ${crypto.randomUUID()}`,
      description: "Should link to context node on confirm.",
    },
  ]);

  const result = await suggestionService.confirmSuggestions(
    [suggestions[0].id],
    contextNode.id,
  );

  if (result.nodes.length !== 1) {
    throw new Error("Expected one confirmed node");
  }

  const link = await prisma.nodeLink.findFirst({
    where: {
      userId: DEFAULT_USER_ID,
      sourceNodeId: contextNode.id,
      targetNodeId: result.nodes[0].id,
      linkType: "related",
    },
  });

  if (link === null) {
    throw new Error("Expected related link from context node to confirmed node");
  }

  await prisma.nodeLink.deleteMany({
    where: { id: link.id, userId: DEFAULT_USER_ID },
  });
  await prisma.knowledgeNode.deleteMany({
    where: { id: result.nodes[0].id, userId: DEFAULT_USER_ID },
  });
  await prisma.conversation.deleteMany({
    where: { id: conversation.id, userId: DEFAULT_USER_ID },
  });
  await prisma.knowledgeNode.deleteMany({
    where: { id: contextNode.id, userId: DEFAULT_USER_ID },
  });

  console.log("OK: confirm with contextNodeId creates related link");
}

async function main(): Promise<void> {
  await assertEmptyMessageRejected();
  await assertSendPersistsMessagesAndSuggestions();
  await assertConversationContextMismatchRejected();
  await assertConfirmLinksContextNode();

  console.log("OK: Side chat tests passed");
}

main()
  .catch((error: unknown) => {
    console.error("Side chat test failed");

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
