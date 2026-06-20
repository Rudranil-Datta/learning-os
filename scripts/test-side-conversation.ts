import "dotenv/config";

import { createConversationService, createKnowledgeNodeService } from "../lib/api/error-handler";
import { DEFAULT_USER_ID } from "../lib/constants/user";
import { prisma } from "../lib/db/client";
import { isAppError } from "../lib/errors/app-error";

async function assertGetOrCreateSideConversationIdempotent(
  contextNodeId: string,
): Promise<string> {
  const service = createConversationService();

  const first = await service.getOrCreateSideConversation(contextNodeId);
  const second = await service.getOrCreateSideConversation(contextNodeId);

  if (first.id !== second.id) {
    throw new Error("Expected same side conversation id on second call");
  }

  if (first.contextNodeId !== contextNodeId) {
    throw new Error("Side conversation missing contextNodeId");
  }

  const row = await prisma.conversation.findFirst({
    where: {
      id: first.id,
      userId: DEFAULT_USER_ID,
      contextNodeId,
    },
  });

  if (row === null) {
    throw new Error("Side conversation row not found in DB");
  }

  console.log("OK: getOrCreateSideConversation idempotent");
  return first.id;
}

async function assertMainConversationListExcludesSide(
  sideConversationId: string,
): Promise<void> {
  const service = createConversationService();
  const mainConversations = await service.listMainConversations();

  if (mainConversations.some((conversation) => conversation.id === sideConversationId)) {
    throw new Error("Main conversation list should not include side conversation");
  }

  console.log("OK: main conversation list excludes side conversation");
}

async function assertUnknownNodeReturnsNotFound(): Promise<void> {
  const service = createConversationService();

  try {
    await service.getOrCreateSideConversation(
      "00000000-0000-0000-0000-000000000099",
    );
    throw new Error("Expected NotFoundError for unknown node");
  } catch (error: unknown) {
    if (!isAppError(error) || error.code !== "NOT_FOUND") {
      throw error;
    }
  }

  console.log("OK: unknown context node returns NOT_FOUND");
}

async function cleanup(sideConversationId: string, nodeTitle: string): Promise<void> {
  await prisma.conversation.deleteMany({
    where: {
      id: sideConversationId,
      userId: DEFAULT_USER_ID,
    },
  });

  await prisma.knowledgeNode.deleteMany({
    where: {
      userId: DEFAULT_USER_ID,
      title: nodeTitle,
    },
  });
}

async function main(): Promise<void> {
  await assertUnknownNodeReturnsNotFound();

  const nodeService = createKnowledgeNodeService();
  const suffix = crypto.randomUUID();
  const title = `Side Conversation Node ${suffix}`;

  const node = await nodeService.createNode({
    title,
    explanation: "Test node for side conversation.",
  });

  const sideConversationId = await assertGetOrCreateSideConversationIdempotent(
    node.id,
  );

  await assertMainConversationListExcludesSide(sideConversationId);

  await cleanup(sideConversationId, title);

  console.log("OK: Side conversation tests passed");
}

main()
  .catch((error: unknown) => {
    console.error("Side conversation test failed");

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
