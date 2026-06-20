import "dotenv/config";

import {
  createChatService,
  createConversationService,
  createSuggestionService,
} from "../lib/api/error-handler";
import { DEFAULT_USER_ID } from "../lib/constants/user";
import { prisma } from "../lib/db/client";
import { SuggestionRepository } from "../lib/db/queries/suggestions";
import { isAppError } from "../lib/errors/app-error";
import { isLLMError } from "../lib/errors/llm-error";
import type { ChatResponse } from "../types/api";

const TEST_MESSAGE =
  "Explain binary search, divide and conquer, and why it runs in O(log n) time.";

interface PendingPair {
  readonly confirmId: string;
  readonly rejectId: string;
  readonly confirmTitle: string;
  readonly rejectTitle: string;
}

function assertSuggestedNodes(
  suggestedNodes: ChatResponse["suggestedNodes"],
): void {
  for (const node of suggestedNodes) {
    if (!node.id.trim() || !node.title.trim()) {
      throw new Error("Suggested node missing id or title");
    }
  }
}

async function seedConfirmDismissPair(
  conversationId: string,
): Promise<PendingPair> {
  const suffix = crypto.randomUUID();
  const suggestionRepository = new SuggestionRepository(prisma);

  const seeded = await suggestionRepository.createMany([
    {
      userId: DEFAULT_USER_ID,
      conversationId,
      title: `E2E Confirm ${suffix}`,
      description: "E2E confirm path",
    },
    {
      userId: DEFAULT_USER_ID,
      conversationId,
      title: `E2E Reject ${suffix}`,
      description: "E2E dismiss path",
    },
  ]);

  if (seeded.length !== 2) {
    throw new Error("Failed to seed confirm/dismiss pair");
  }

  return {
    confirmId: seeded[0].id,
    rejectId: seeded[1].id,
    confirmTitle: seeded[0].title,
    rejectTitle: seeded[1].title,
  };
}

async function main(): Promise<void> {
  const conversationService = createConversationService();
  const chatService = createChatService();
  const suggestionService = createSuggestionService();
  const suffix = crypto.randomUUID();

  const created = await conversationService.createMainConversation();

  if (created.title !== "New chat") {
    throw new Error("New conversation should start with placeholder title");
  }

  const emptyHistory = await chatService.getMainChatHistory(created.id);

  if (emptyHistory.messages.length !== 0) {
    throw new Error("New conversation should have empty history");
  }

  console.log(`OK: created conversation ${created.id}`);

  const chatResult = await chatService.sendMessage({
    message: `${TEST_MESSAGE} (${suffix})`,
    conversationId: created.id,
  });

  if (!chatResult.answer.trim()) {
    throw new Error("Chat response answer was empty");
  }

  if (chatResult.conversationId !== created.id) {
    throw new Error("Chat should stay on the created conversation");
  }

  assertSuggestedNodes(chatResult.suggestedNodes);

  const conversationAfterSend = await prisma.conversation.findFirst({
    where: { id: created.id, userId: DEFAULT_USER_ID },
    select: { title: true },
  });

  if (
    !conversationAfterSend?.title ||
    conversationAfterSend.title.trim().length === 0
  ) {
    throw new Error("First message should set conversation title");
  }

  console.log("OK: first message sent and title set");

  const historyWithPills = await chatService.getMainChatHistory(created.id);

  if (historyWithPills.messages.length < 2) {
    throw new Error("History should include user and assistant messages");
  }

  const assistants = historyWithPills.messages.filter(
    (message) => message.role === "assistant",
  );

  const lastAssistant = assistants.at(-1);

  if (!lastAssistant) {
    throw new Error("History missing assistant message");
  }

  const pendingOnHistory = lastAssistant.suggestedNodes ?? [];

  if (pendingOnHistory.length === 0 && chatResult.suggestedNodes.length === 0) {
    console.log("Note: LLM returned no suggestions; will seed for confirm/dismiss");
  } else if (pendingOnHistory.length < chatResult.suggestedNodes.length) {
    throw new Error("History should expose pending pills on last assistant");
  }

  console.log("OK: history reload includes messages and pending pills");

  const conversations = await conversationService.listMainConversations();
  const listed = conversations.find((conversation) => conversation.id === created.id);

  if (!listed) {
    throw new Error("Created conversation missing from list");
  }

  if (listed.title === "New chat") {
    throw new Error("Listed conversation should show derived title after first send");
  }

  console.log("OK: conversation appears in sidebar list with title");

  const pendingPair = await seedConfirmDismissPair(created.id);

  const confirmResult = await suggestionService.confirmSuggestions([
    pendingPair.confirmId,
  ]);

  if (confirmResult.nodes.length !== 1) {
    throw new Error("Confirm should create one knowledge node");
  }

  if (confirmResult.nodes[0].title !== pendingPair.confirmTitle) {
    throw new Error("Confirmed node title mismatch");
  }

  await suggestionService.rejectSuggestion(pendingPair.rejectId);

  const extraPending = await prisma.pendingNodeSuggestion.findMany({
    where: {
      conversationId: created.id,
      userId: DEFAULT_USER_ID,
      status: "pending",
    },
    select: { id: true },
  });

  for (const row of extraPending) {
    await suggestionService.rejectSuggestion(row.id);
  }

  const confirmedPending = await prisma.pendingNodeSuggestion.findFirst({
    where: { id: pendingPair.confirmId, userId: DEFAULT_USER_ID },
  });

  if (confirmedPending !== null) {
    throw new Error("Confirmed suggestion should be removed");
  }

  const rejectedPending = await prisma.pendingNodeSuggestion.findFirst({
    where: { id: pendingPair.rejectId, userId: DEFAULT_USER_ID },
  });

  if (rejectedPending !== null) {
    throw new Error("Rejected suggestion should be removed");
  }

  const confirmedNode = await prisma.knowledgeNode.findFirst({
    where: {
      id: confirmResult.nodes[0].id,
      userId: DEFAULT_USER_ID,
      title: pendingPair.confirmTitle,
    },
  });

  if (confirmedNode === null) {
    throw new Error("Confirmed knowledge node not found in DB");
  }

  const rejectedNode = await prisma.knowledgeNode.findFirst({
    where: {
      userId: DEFAULT_USER_ID,
      title: pendingPair.rejectTitle,
    },
  });

  if (rejectedNode !== null) {
    throw new Error("Reject should not create a knowledge node");
  }

  const historyAfterActions = await chatService.getMainChatHistory(created.id);
  const assistantAfter = historyAfterActions.messages
    .filter((message) => message.role === "assistant")
    .at(-1);

  if (assistantAfter?.suggestedNodes && assistantAfter.suggestedNodes.length > 0) {
    throw new Error("Pending pills should clear after confirm and dismiss");
  }

  const remainingPending = await prisma.pendingNodeSuggestion.count({
    where: {
      conversationId: created.id,
      userId: DEFAULT_USER_ID,
      status: "pending",
    },
  });

  if (remainingPending > 0) {
    throw new Error("No pending suggestions should remain after confirm/dismiss");
  }

  console.log("OK: confirm and dismiss completed");
  console.log(`Confirmed node: ${confirmResult.nodes[0].id} (${pendingPair.confirmTitle})`);
  console.log("OK: Main chat E2E passed");
}

main()
  .catch((error: unknown) => {
    console.error("Main chat E2E failed");

    if (isLLMError(error) || isAppError(error)) {
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
