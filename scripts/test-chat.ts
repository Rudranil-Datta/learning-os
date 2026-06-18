import "dotenv/config";

import { createChatService } from "../lib/api/error-handler";
import { DEFAULT_USER_ID } from "../lib/constants/user";
import { prisma } from "../lib/db/client";
import { isAppError } from "../lib/errors/app-error";
import { isLLMError } from "../lib/errors/llm-error";
import type { ChatResponse } from "../types/api";
import { SUGGESTION_STATUS } from "../types/database";

const TEST_MESSAGE =
  "Explain binary search, divide and conquer, and why it runs in O(log n) time.";

function assertSuggestedNodes(
  suggestedNodes: ChatResponse["suggestedNodes"],
): void {
  if (!Array.isArray(suggestedNodes)) {
    throw new Error("Chat response suggestedNodes is not an array");
  }

  for (const node of suggestedNodes) {
    if (!node.id.trim()) {
      throw new Error("Suggested node missing id");
    }

    if (!node.title.trim()) {
      throw new Error("Suggested node has empty title");
    }

    if (node.description !== null && typeof node.description !== "string") {
      throw new Error("Suggested node description must be string or null");
    }
  }
}

async function assertPersistedSuggestions(
  conversationId: string,
  suggestedNodes: ChatResponse["suggestedNodes"],
): Promise<void> {
  if (suggestedNodes.length === 0) {
    console.log("OK: No suggestions to persist");
    return;
  }

  const rows = await prisma.pendingNodeSuggestion.findMany({
    where: {
      conversationId,
      userId: DEFAULT_USER_ID,
      status: SUGGESTION_STATUS.pending,
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
    },
  });

  if (rows.length !== suggestedNodes.length) {
    throw new Error(
      `Expected ${suggestedNodes.length} pending suggestions in DB, found ${rows.length}`,
    );
  }

  const rowsById = new Map(rows.map((row) => [row.id, row]));

  for (const node of suggestedNodes) {
    const row = rowsById.get(node.id);

    if (!row) {
      throw new Error(`Pending suggestion not found in DB: ${node.id}`);
    }

    if (row.title !== node.title) {
      throw new Error(`Suggestion title mismatch for id ${node.id}`);
    }

    if (row.description !== node.description) {
      throw new Error(`Suggestion description mismatch for id ${node.id}`);
    }

    if (row.status !== SUGGESTION_STATUS.pending) {
      throw new Error(`Suggestion status is not pending for id ${node.id}`);
    }
  }

  console.log(`OK: ${rows.length} pending suggestion(s) persisted`);
}

async function main(): Promise<void> {
  const chatService = createChatService();

  const result = await chatService.sendMessage({
    message: TEST_MESSAGE,
  });

  if (!result.answer.trim()) {
    throw new Error("Chat response answer was empty");
  }

  if (!result.conversationId) {
    throw new Error("Chat response missing conversationId");
  }

  assertSuggestedNodes(result.suggestedNodes);
  await assertPersistedSuggestions(result.conversationId, result.suggestedNodes);

  console.log("OK: Main chat path successful");
  console.log(`Conversation: ${result.conversationId}`);
  console.log(`Answer: ${result.answer.trim()}`);
  console.log(`Suggested nodes: ${result.suggestedNodes.length}`);

  for (const node of result.suggestedNodes) {
    console.log(`- ${node.id}: ${node.title}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error("Main chat test failed");

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
