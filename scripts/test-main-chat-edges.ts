import "dotenv/config";

import type {
  MainChatOrchestrator,
  MainChatOrchestratorResult,
} from "../lib/agents/orchestrator";
import { createKnowledgeNodeService } from "../lib/api/error-handler";
import { DEFAULT_USER_ID } from "../lib/constants/user";
import { prisma } from "../lib/db/client";
import { ConversationRepository } from "../lib/db/queries/conversations";
import { KnowledgeNodeRepository } from "../lib/db/queries/nodes";
import { MessageRepository } from "../lib/db/queries/messages";
import { SuggestionRepository } from "../lib/db/queries/suggestions";
import {
  NotFoundError,
  ValidationError,
  isAppError,
} from "../lib/errors/app-error";
import { ChatService } from "../lib/services/chat.service";
import {
  chatHistoryQuerySchema,
  chatRequestSchema,
} from "../lib/validation/chat.schema";

function createStubOrchestrator(
  result: Pick<MainChatOrchestratorResult, "answer" | "suggestedNodes">,
): MainChatOrchestrator {
  return {
    run: async (): Promise<MainChatOrchestratorResult> => ({
      answer: result.answer,
      conversationId: null,
      suggestedNodes: result.suggestedNodes,
      contextNodeIds: [],
    }),
  } as unknown as MainChatOrchestrator;
}

function createTestChatService(
  orchestrator: MainChatOrchestrator,
  userId: string = DEFAULT_USER_ID,
): ChatService {
  const knowledgeNodeService = createKnowledgeNodeService();

  return new ChatService(
    prisma,
    new ConversationRepository(prisma),
    new MessageRepository(prisma),
    new SuggestionRepository(prisma),
    knowledgeNodeService,
    userId,
    orchestrator,
  );
}

async function assertEmptyMessageRejected(): Promise<void> {
  const chatService = createTestChatService(
    createStubOrchestrator({ answer: "unused", suggestedNodes: [] }),
  );

  try {
    await chatService.sendMessage({ message: "   " });
    throw new Error("Expected ValidationError for empty message");
  } catch (error: unknown) {
    if (!(error instanceof ValidationError)) {
      throw error;
    }
  }

  const parsed = chatRequestSchema.safeParse({ message: "" });
  if (parsed.success) {
    throw new Error("chatRequestSchema should reject empty message");
  }

  console.log("OK: empty message rejected");
}

async function assertEmptySuggestedNodesChatOk(): Promise<void> {
  const chatService = createTestChatService(
    createStubOrchestrator({
      answer: "Deterministic answer with no concepts.",
      suggestedNodes: [],
    }),
  );

  const result = await chatService.sendMessage({
    message: `Hello without suggestions ${crypto.randomUUID()}`,
  });

  if (result.suggestedNodes.length !== 0) {
    throw new Error("Expected empty suggestedNodes in response");
  }

  const history = await chatService.getMainChatHistory(result.conversationId!);

  const assistantMessages = history.messages.filter(
    (message) => message.role === "assistant",
  );

  if (assistantMessages.length !== 1) {
    throw new Error("Expected one assistant message in history");
  }

  if (assistantMessages[0].suggestedNodes !== undefined) {
    throw new Error("Expected no suggestedNodes on assistant when none pending");
  }

  const pendingCount = await prisma.pendingNodeSuggestion.count({
    where: { conversationId: result.conversationId!, userId: DEFAULT_USER_ID },
  });

  if (pendingCount !== 0) {
    throw new Error("Expected no pending suggestions in DB");
  }

  console.log("OK: chat succeeds with empty suggestedNodes and no pills");
}

async function assertHistoryEmptyForNewConversation(): Promise<void> {
  const conversationRepository = new ConversationRepository(prisma);
  const chatService = createTestChatService(
    createStubOrchestrator({ answer: "unused", suggestedNodes: [] }),
  );

  const conversation = await conversationRepository.create({
    userId: DEFAULT_USER_ID,
    contextNodeId: null,
  });

  const history = await chatService.getMainChatHistory(conversation.id);

  if (history.conversationId !== conversation.id) {
    throw new Error("Expected history for the new empty conversation");
  }

  if (history.messages.length !== 0) {
    throw new Error("Expected empty messages on new conversation");
  }

  console.log("OK: new conversation history is empty");
}

async function assertHistoryNotFoundForUnknownId(): Promise<void> {
  const chatService = createTestChatService(
    createStubOrchestrator({ answer: "unused", suggestedNodes: [] }),
  );

  try {
    await chatService.getMainChatHistory(crypto.randomUUID());
    throw new Error("Expected NotFoundError for unknown conversationId");
  } catch (error: unknown) {
    if (!(error instanceof NotFoundError)) {
      throw error;
    }
  }

  console.log("OK: unknown conversationId returns NotFoundError");
}

async function assertHistoryNotFoundForNodeContextConversation(): Promise<void> {
  const nodeRepository = new KnowledgeNodeRepository(prisma);
  const conversationRepository = new ConversationRepository(prisma);
  const chatService = createTestChatService(
    createStubOrchestrator({ answer: "unused", suggestedNodes: [] }),
  );

  const node = await nodeRepository.create(
    {
      title: `Node Context Host ${crypto.randomUUID()}`,
      description: "Edge test node",
    },
    DEFAULT_USER_ID,
  );

  const nodeConversation = await conversationRepository.create({
    userId: DEFAULT_USER_ID,
    contextNodeId: node.id,
  });

  try {
    await chatService.getMainChatHistory(nodeConversation.id);
    throw new Error("Expected NotFoundError for node-context conversation");
  } catch (error: unknown) {
    if (!(error instanceof NotFoundError)) {
      throw error;
    }
  }

  console.log("OK: node-context conversationId returns NotFoundError on main history");
}

async function assertHistoryUsesLatestWhenNoIdProvided(): Promise<void> {
  const suffix = crypto.randomUUID();
  const conversationRepository = new ConversationRepository(prisma);
  const messageRepository = new MessageRepository(prisma);
  const chatService = createTestChatService(
    createStubOrchestrator({ answer: "unused", suggestedNodes: [] }),
  );

  await conversationRepository.create({
    userId: DEFAULT_USER_ID,
    contextNodeId: null,
    title: `Older chat ${suffix}`,
  });

  const newer = await conversationRepository.create({
    userId: DEFAULT_USER_ID,
    contextNodeId: null,
    title: `Newer chat ${suffix}`,
  });

  await messageRepository.create({
    conversationId: newer.id,
    role: "user",
    content: "Newer message",
  });

  const history = await chatService.getMainChatHistory();

  if (history.conversationId !== newer.id) {
    throw new Error("Expected latest-created main conversation when id omitted");
  }

  console.log("OK: history without id resolves to latest main conversation");
}

async function assertPendingPillsOnLastAssistantOnly(): Promise<void> {
  const suffix = crypto.randomUUID();
  const conversationRepository = new ConversationRepository(prisma);
  const messageRepository = new MessageRepository(prisma);
  const suggestionRepository = new SuggestionRepository(prisma);
  const chatService = createTestChatService(
    createStubOrchestrator({ answer: "unused", suggestedNodes: [] }),
  );

  const conversation = await conversationRepository.create({
    userId: DEFAULT_USER_ID,
    contextNodeId: null,
  });

  await messageRepository.create({
    conversationId: conversation.id,
    role: "user",
    content: "First question",
  });

  await messageRepository.create({
    conversationId: conversation.id,
    role: "assistant",
    content: "First answer",
  });

  await messageRepository.create({
    conversationId: conversation.id,
    role: "user",
    content: "Second question",
  });

  await messageRepository.create({
    conversationId: conversation.id,
    role: "assistant",
    content: "Second answer",
  });

  const [pending] = await suggestionRepository.createMany([
    {
      userId: DEFAULT_USER_ID,
      conversationId: conversation.id,
      title: `Pending Pill ${suffix}`,
      description: "Reload pill test",
    },
  ]);

  const history = await chatService.getMainChatHistory(conversation.id);

  const assistants = history.messages.filter(
    (message) => message.role === "assistant",
  );

  if (assistants.length !== 2) {
    throw new Error("Expected two assistant messages in history");
  }

  if (assistants[0].suggestedNodes !== undefined) {
    throw new Error("Expected no pills on first assistant message");
  }

  if (!assistants[1].suggestedNodes || assistants[1].suggestedNodes.length !== 1) {
    throw new Error("Expected pending pill on last assistant only");
  }

  if (assistants[1].suggestedNodes[0].id !== pending.id) {
    throw new Error("Pending pill id mismatch on last assistant");
  }

  console.log("OK: pending pills attach to last assistant message only");
}

async function assertFirstSendSetsConversationTitle(): Promise<void> {
  const conversationRepository = new ConversationRepository(prisma);
  const firstMessage =
    "Explain gradient descent and learning rate for neural networks";
  const chatService = createTestChatService(
    createStubOrchestrator({
      answer: "Gradient descent minimizes loss.",
      suggestedNodes: [],
    }),
  );

  const conversation = await conversationRepository.create({
    userId: DEFAULT_USER_ID,
    contextNodeId: null,
    title: null,
  });

  const result = await chatService.sendMessage({
    message: firstMessage,
    conversationId: conversation.id,
  });

  const updated = await conversationRepository.findById(
    conversation.id,
    DEFAULT_USER_ID,
  );

  if (updated === null) {
    throw new Error("Conversation missing after first send");
  }

  if (!updated.title || updated.title.trim().length === 0) {
    throw new Error("Expected conversation title set after first message");
  }

  if (!updated.title.toLowerCase().includes("gradient descent")) {
    throw new Error("Conversation title should derive from first user message");
  }

  if (result.conversationId !== conversation.id) {
    throw new Error("First send should stay on the new conversation");
  }

  console.log("OK: first send on new chat sets conversation title");
}

async function assertSendMessageUsesExplicitConversationId(): Promise<void> {
  const suffix = crypto.randomUUID();
  const conversationRepository = new ConversationRepository(prisma);
  const chatService = createTestChatService(
    createStubOrchestrator({
      answer: "Explicit conversation reply.",
      suggestedNodes: [],
    }),
  );

  const target = await conversationRepository.create({
    userId: DEFAULT_USER_ID,
    contextNodeId: null,
    title: `Target chat ${suffix}`,
  });

  await conversationRepository.create({
    userId: DEFAULT_USER_ID,
    contextNodeId: null,
    title: `Other chat ${suffix}`,
  });

  const result = await chatService.sendMessage({
    message: `Message to target ${suffix}`,
    conversationId: target.id,
  });

  if (result.conversationId !== target.id) {
    throw new Error("sendMessage should use explicit conversationId");
  }

  const messageCount = await prisma.message.count({
    where: { conversationId: target.id },
  });

  if (messageCount !== 2) {
    throw new Error("Expected user and assistant messages on target conversation");
  }

  console.log("OK: sendMessage honors explicit conversationId");
}

async function assertInvalidConversationIdQueryRejected(): Promise<void> {
  const parsed = chatHistoryQuerySchema.safeParse({
    conversationId: "not-a-valid-uuid",
  });

  if (parsed.success) {
    throw new Error("chatHistoryQuerySchema should reject invalid conversationId");
  }

  console.log("OK: invalid conversationId query rejected by schema");
}

async function main(): Promise<void> {
  await assertEmptyMessageRejected();
  await assertEmptySuggestedNodesChatOk();
  await assertHistoryEmptyForNewConversation();
  await assertHistoryNotFoundForUnknownId();
  await assertHistoryNotFoundForNodeContextConversation();
  await assertHistoryUsesLatestWhenNoIdProvided();
  await assertPendingPillsOnLastAssistantOnly();
  await assertFirstSendSetsConversationTitle();
  await assertSendMessageUsesExplicitConversationId();
  await assertInvalidConversationIdQueryRejected();

  console.log("OK: Main chat edge tests passed");
}

main()
  .catch((error: unknown) => {
    console.error("Main chat edge tests failed");

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
