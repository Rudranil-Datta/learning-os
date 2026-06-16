import { createLLMProvider } from "@/lib/llm/create-llm-provider";
import type { LLMProvider } from "@/lib/llm/llm-provider";
import type {
  CallOpenAIOptions,
  CallOpenAIResult,
  ChatMessage,
} from "@/types/llm";

const globalForLlm = globalThis as unknown as {
  llmProvider: LLMProvider | undefined;
};

function getLLMProvider(): LLMProvider {
  if (!globalForLlm.llmProvider) {
    globalForLlm.llmProvider = createLLMProvider();
  }

  return globalForLlm.llmProvider;
}

export async function callOpenAI(
  messages: readonly ChatMessage[],
  options?: CallOpenAIOptions,
): Promise<CallOpenAIResult> {
  return getLLMProvider().complete({ messages, options });
}
