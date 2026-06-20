import "dotenv/config";

import { createSuggestionService } from "../lib/api/error-handler";
import { DEFAULT_USER_ID } from "../lib/constants/user";
import { prisma } from "../lib/db/client";
import { ConversationRepository } from "../lib/db/queries/conversations";
import { KnowledgeNodeRepository } from "../lib/db/queries/nodes";
import { SuggestionRepository } from "../lib/db/queries/suggestions";
import { ConflictError, isAppError } from "../lib/errors/app-error";

interface SeededSuggestions {
  readonly confirmId: string;
  readonly rejectId: string;
  readonly confirmTitle: string;
  readonly rejectTitle: string;
}

async function seedPendingSuggestions(): Promise<SeededSuggestions> {
  const conversationRepository = new ConversationRepository(prisma);
  const suggestionRepository = new SuggestionRepository(prisma);
  const suffix = crypto.randomUUID();

  const conversation = await conversationRepository.create({
    userId: DEFAULT_USER_ID,
  });

  const suggestions = await suggestionRepository.createMany([
    {
      userId: DEFAULT_USER_ID,
      conversationId: conversation.id,
      title: `Suggestion Confirm ${suffix}`,
      description: "Confirm path test",
    },
    {
      userId: DEFAULT_USER_ID,
      conversationId: conversation.id,
      title: `Suggestion Reject ${suffix}`,
      description: "Reject path test",
    },
  ]);

  if (suggestions.length !== 2) {
    throw new Error("Failed to seed pending suggestions");
  }

  return {
    confirmId: suggestions[0].id,
    rejectId: suggestions[1].id,
    confirmTitle: suggestions[0].title,
    rejectTitle: suggestions[1].title,
  };
}

async function assertConfirmCreatesNodeAndDeletesPending(
  seeded: SeededSuggestions,
): Promise<void> {
  const suggestionService = createSuggestionService();
  const result = await suggestionService.confirmSuggestions([seeded.confirmId]);

  if (result.nodes.length !== 1) {
    throw new Error("Expected one node from confirm");
  }

  if (result.nodes[0].title !== seeded.confirmTitle) {
    throw new Error("Confirmed node title mismatch");
  }

  const pending = await prisma.pendingNodeSuggestion.findFirst({
    where: { id: seeded.confirmId, userId: DEFAULT_USER_ID },
  });

  if (pending !== null) {
    throw new Error("Pending suggestion still exists after confirm");
  }

  const node = await prisma.knowledgeNode.findFirst({
    where: {
      id: result.nodes[0].id,
      userId: DEFAULT_USER_ID,
      title: seeded.confirmTitle,
    },
  });

  if (node === null) {
    throw new Error("Confirmed knowledge node not found in DB");
  }

  console.log("OK: confirm creates node and deletes pending suggestion");
}

async function assertRejectDeletesPendingWithoutNode(
  seeded: SeededSuggestions,
): Promise<void> {
  const suggestionService = createSuggestionService();

  await suggestionService.rejectSuggestion(seeded.rejectId);

  const pending = await prisma.pendingNodeSuggestion.findFirst({
    where: { id: seeded.rejectId, userId: DEFAULT_USER_ID },
  });

  if (pending !== null) {
    throw new Error("Pending suggestion still exists after reject");
  }

  const node = await prisma.knowledgeNode.findFirst({
    where: {
      userId: DEFAULT_USER_ID,
      title: seeded.rejectTitle,
    },
  });

  if (node !== null) {
    throw new Error("Reject created a knowledge node unexpectedly");
  }

  console.log("OK: reject deletes pending suggestion without creating node");
}

async function assertDuplicateTitleReturnsConflict(
  confirmTitle: string,
): Promise<void> {
  const conversationRepository = new ConversationRepository(prisma);
  const suggestionRepository = new SuggestionRepository(prisma);
  const suggestionService = createSuggestionService();

  const conversation = await conversationRepository.create({
    userId: DEFAULT_USER_ID,
  });

  const [duplicatePending] = await suggestionRepository.createMany([
    {
      userId: DEFAULT_USER_ID,
      conversationId: conversation.id,
      title: confirmTitle,
      description: "Duplicate title test",
    },
  ]);

  try {
    await suggestionService.confirmSuggestions([duplicatePending.id]);
    throw new Error("Expected ConflictError for duplicate title");
  } catch (error: unknown) {
    if (!(error instanceof ConflictError)) {
      throw error;
    }
  }

  const stalePending = await prisma.pendingNodeSuggestion.findFirst({
    where: { id: duplicatePending.id, userId: DEFAULT_USER_ID },
  });

  if (stalePending === null) {
    throw new Error("Duplicate confirm removed pending row unexpectedly");
  }

  await suggestionRepository.deleteById(duplicatePending.id, DEFAULT_USER_ID);

  console.log("OK: duplicate title confirm returns ConflictError");
}

async function assertConfirmCreatesRelatedLinkWhenTitleInExplanation(): Promise<void> {
  const suffix = crypto.randomUUID();
  const conceptTitle = `AutoLink Concept ${suffix}`;
  const knowledgeNodeRepository = new KnowledgeNodeRepository(prisma);
  const conversationRepository = new ConversationRepository(prisma);
  const suggestionRepository = new SuggestionRepository(prisma);
  const suggestionService = createSuggestionService();

  const existingNode = await knowledgeNodeRepository.create(
    {
      title: `Existing Node ${suffix}`,
      description: "Host node",
      explanation: `This concept discusses ${conceptTitle} in depth for learning.`,
    },
    DEFAULT_USER_ID,
  );

  const conversation = await conversationRepository.create({
    userId: DEFAULT_USER_ID,
  });

  const [pending] = await suggestionRepository.createMany([
    {
      userId: DEFAULT_USER_ID,
      conversationId: conversation.id,
      title: conceptTitle,
      description: "Auto-link test",
    },
  ]);

  const result = await suggestionService.confirmSuggestions([pending.id]);

  if (result.nodes.length !== 1) {
    throw new Error("Expected one node from auto-link confirm");
  }

  const link = await prisma.nodeLink.findFirst({
    where: {
      sourceNodeId: existingNode.id,
      targetNodeId: result.nodes[0].id,
      linkType: "related",
      userId: DEFAULT_USER_ID,
    },
  });

  if (link === null) {
    throw new Error("Expected related link from existing node to confirmed node");
  }

  console.log("OK: confirm creates related link when title appears in explanation");
}

async function assertConfirmSkipsLinkWhenTitleNotInExplanation(): Promise<void> {
  const suffix = crypto.randomUUID();
  const knowledgeNodeRepository = new KnowledgeNodeRepository(prisma);
  const conversationRepository = new ConversationRepository(prisma);
  const suggestionRepository = new SuggestionRepository(prisma);
  const suggestionService = createSuggestionService();

  const existingNode = await knowledgeNodeRepository.create(
    {
      title: `Unrelated Node ${suffix}`,
      description: "Host node",
      explanation: "This explanation mentions nothing relevant.",
    },
    DEFAULT_USER_ID,
  );

  const conversation = await conversationRepository.create({
    userId: DEFAULT_USER_ID,
  });

  const unrelatedTitle = `Unrelated Concept ${suffix}`;
  const [pending] = await suggestionRepository.createMany([
    {
      userId: DEFAULT_USER_ID,
      conversationId: conversation.id,
      title: unrelatedTitle,
      description: "No auto-link expected",
    },
  ]);

  const result = await suggestionService.confirmSuggestions([pending.id]);

  const link = await prisma.nodeLink.findFirst({
    where: {
      sourceNodeId: existingNode.id,
      targetNodeId: result.nodes[0].id,
      linkType: "related",
      userId: DEFAULT_USER_ID,
    },
  });

  if (link !== null) {
    throw new Error("Did not expect related link when title is absent from explanation");
  }

  console.log("OK: confirm skips auto-link when title is not in explanation");
}

async function main(): Promise<void> {
  await assertConfirmCreatesRelatedLinkWhenTitleInExplanation();
  await assertConfirmSkipsLinkWhenTitleNotInExplanation();

  const seeded = await seedPendingSuggestions();

  await assertConfirmCreatesNodeAndDeletesPending(seeded);
  await assertRejectDeletesPendingWithoutNode(seeded);
  await assertDuplicateTitleReturnsConflict(seeded.confirmTitle);

  console.log("OK: Suggestion confirm/reject path successful");
}

main()
  .catch((error: unknown) => {
    console.error("Suggestion test failed");

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
