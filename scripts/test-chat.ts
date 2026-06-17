import "dotenv/config";

import { createChatService } from "../lib/api/error-handler";
import { prisma } from "../lib/db/client";
import { isAppError } from "../lib/errors/app-error";
import { isLLMError } from "../lib/errors/llm-error";
import type { ChatResponse } from "../types/api";

const TEST_MESSAGE =
  "Explain binary search, divide and conquer, and why it runs in O(log n) time.";

function assertSuggestedNodes(
  suggestedNodes: ChatResponse["suggestedNodes"],
): void {
  if (!Array.isArray(suggestedNodes)) {
    throw new Error("Chat response suggestedNodes is not an array");
  }

  for (const node of suggestedNodes) {
    if (!node.title.trim()) {
      throw new Error("Suggested node has empty title");
    }

    if (node.description !== null && typeof node.description !== "string") {
      throw new Error("Suggested node description must be string or null");
    }
  }
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

  console.log("OK: Main chat path successful");
  console.log(`Conversation: ${result.conversationId}`);
  console.log(`Answer: ${result.answer.trim()}`);
  console.log(`Suggested nodes: ${result.suggestedNodes.length}`);

  for (const node of result.suggestedNodes) {
    console.log(`- ${node.title}`);
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
