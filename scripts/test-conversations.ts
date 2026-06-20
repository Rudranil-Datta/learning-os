import "dotenv/config";

import type {
  MainChatOrchestrator,
  MainChatOrchestratorResult,
} from "../lib/agents/orchestrator";
import {
  createChatService,
  createConversationService,
  createKnowledgeNodeService,
} from "../lib/api/error-handler";
import { DEFAULT_USER_ID } from "../lib/constants/user";
import { prisma } from "../lib/db/client";
import { ConversationRepository } from "../lib/db/queries/conversations";
import { MessageRepository } from "../lib/db/queries/messages";
import { SuggestionRepository } from "../lib/db/queries/suggestions";
import { isAppError } from "../lib/errors/app-error";
import { ChatService } from "../lib/services/chat.service";

function stubOrchestrator(
  answer: string,
): MainChatOrchestrator {
  return {
    run: async (): Promise<MainChatOrchestratorResult> => ({
      answer,
      conversationId: null,
      suggestedNodes: [],
      contextNodeIds: [],
    }),
  } as unknown as MainChatOrchestrator;
}

async function assertCreateMainConversation(): Promise<string> {
  const service = createConversationService();
  const created = await service.createMainConversation();

  if (!created.id.trim()) {
    throw new Error("createMainConversation missing id");
  }

  if (created.title !== "New chat") {
    throw new Error("createMainConversation should return placeholder title");
  }

  console.log("OK: createMainConversation");
  return created.id;
}

async function assertListIncludesConversation(conversationId: string): Promise<void> {
  const service = createConversationService();
  const list = await service.listMainConversations();

  if (!list.some((row) => row.id === conversationId)) {
    throw new Error("listMainConversations missing created conversation");
  }

  console.log("OK: listMainConversations includes created chat");
}

async function assertHistoryByIdEmpty(conversationId: string): Promise<void> {
  const chatService = createChatService();
  const history = await chatService.getMainChatHistory(conversationId);

  if (history.conversationId !== conversationId) {
    throw new Error("history by id returned wrong conversationId");
  }

  if (history.messages.length !== 0) {
    throw new Error("new conversation history should be empty");
  }

  console.log("OK: history by id empty for new conversation");
}

async function assertHistoryByIdReturnsMessages(): Promise<void> {
  const suffix = crypto.randomUUID();
  const conversationRepository = new ConversationRepository(prisma);
  const messageRepository = new MessageRepository(prisma);
  const chatService = createChatService();

  const target = await conversationRepository.create({
    userId: DEFAULT_USER_ID,
    contextNodeId: null,
  });

  const other = await conversationRepository.create({
    userId: DEFAULT_USER_ID,
    contextNodeId: null,
  });

  await messageRepository.create({
    conversationId: target.id,
    role: "user",
    content: `Target message ${suffix}`,
  });

  await messageRepository.create({
    conversationId: target.id,
    role: "assistant",
    content: `Target reply ${suffix}`,
  });

  await messageRepository.create({
    conversationId: other.id,
    role: "user",
    content: "Other conversation only",
  });

  const history = await chatService.getMainChatHistory(target.id);

  if (history.messages.length !== 2) {
    throw new Error("history by id should return only target messages");
  }

  if (!history.messages[0].content.includes(suffix)) {
    throw new Error("history by id returned wrong conversation messages");
  }

  console.log("OK: history by id scoped to conversation");
}

async function assertListUsesExplicitTitle(): Promise<void> {
  const suffix = crypto.randomUUID();
  const title = `Explicit Title ${suffix}`;
  const conversationRepository = new ConversationRepository(prisma);
  const service = createConversationService();

  const conversation = await conversationRepository.create({
    userId: DEFAULT_USER_ID,
    contextNodeId: null,
    title,
  });

  const list = await service.listMainConversations();
  const row = list.find((item) => item.id === conversation.id);

  if (!row || row.title !== title) {
    throw new Error("list should use stored conversation title");
  }

  console.log("OK: list uses explicit title");
}

async function assertListUsesMessagePreviewWhenUntitled(): Promise<void> {
  const suffix = crypto.randomUUID();
  const preview = `Preview title from message ${suffix}`;
  const conversationRepository = new ConversationRepository(prisma);
  const messageRepository = new MessageRepository(prisma);
  const service = createConversationService();

  const conversation = await conversationRepository.create({
    userId: DEFAULT_USER_ID,
    contextNodeId: null,
    title: null,
  });

  await messageRepository.create({
    conversationId: conversation.id,
    role: "user",
    content: preview,
  });

  const list = await service.listMainConversations();
  const row = list.find((item) => item.id === conversation.id);

  if (!row || !row.title.includes(suffix)) {
    throw new Error("list should derive title from last message preview");
  }

  console.log("OK: list derives title from message preview");
}

async function assertListOrdersByRecentActivity(): Promise<void> {
  const suffix = crypto.randomUUID();
  const conversationRepository = new ConversationRepository(prisma);
  const messageRepository = new MessageRepository(prisma);
  const service = createConversationService();

  const older = await conversationRepository.create({
    userId: DEFAULT_USER_ID,
    contextNodeId: null,
    title: `Older ${suffix}`,
  });

  const newer = await conversationRepository.create({
    userId: DEFAULT_USER_ID,
    contextNodeId: null,
    title: `Newer ${suffix}`,
  });

  await messageRepository.create({
    conversationId: older.id,
    role: "user",
    content: "older activity",
  });

  await new Promise((resolve) => setTimeout(resolve, 5));

  await messageRepository.create({
    conversationId: newer.id,
    role: "user",
    content: "newer activity",
  });

  const list = await service.listMainConversations();
  const olderIndex = list.findIndex((row) => row.id === older.id);
  const newerIndex = list.findIndex((row) => row.id === newer.id);

  if (olderIndex < 0 || newerIndex < 0) {
    throw new Error("expected conversations missing from list");
  }

  if (newerIndex >= olderIndex) {
    throw new Error("list should order by most recent message activity");
  }

  console.log("OK: list ordered by recent activity");
}

async function assertSendSetsTitleVisibleInList(): Promise<void> {
  const suffix = crypto.randomUUID();
  const service = createConversationService();
  const knowledgeNodeService = createKnowledgeNodeService();
  const chatService = new ChatService(
    prisma,
    new ConversationRepository(prisma),
    new MessageRepository(prisma),
    new SuggestionRepository(prisma),
    knowledgeNodeService,
    DEFAULT_USER_ID,
    stubOrchestrator("stub reply"),
  );

  const created = await service.createMainConversation();
  const message = `List title after send ${suffix}`;

  await chatService.sendMessage({
    message,
    conversationId: created.id,
  });

  const list = await service.listMainConversations();
  const row = list.find((item) => item.id === created.id);

  if (!row || !row.title.toLowerCase().includes("list title after send")) {
    throw new Error("list should show title after first send");
  }

  console.log("OK: list reflects title after first send");
}

async function main(): Promise<void> {
  const createdId = await assertCreateMainConversation();
  await assertListIncludesConversation(createdId);
  await assertHistoryByIdEmpty(createdId);
  await assertHistoryByIdReturnsMessages();
  await assertListUsesExplicitTitle();
  await assertListUsesMessagePreviewWhenUntitled();
  await assertListOrdersByRecentActivity();
  await assertSendSetsTitleVisibleInList();

  console.log("OK: Conversation API tests passed");
}

main()
  .catch((error: unknown) => {
    console.error("Conversation tests failed");

    if (isAppError(error)) {
      console.error(`${error.name}: ${error.message}`);
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
