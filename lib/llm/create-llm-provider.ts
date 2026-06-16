import type { LLMProvider } from "@/lib/llm/llm-provider";
import { OpenAIProvider } from "@/lib/llm/providers/openai-provider";
import { LLMConfigurationError } from "@/lib/errors/llm-error";

const SUPPORTED_PROVIDERS = new Set(["openai", "openai-compatible"]);

export function createLLMProvider(): LLMProvider {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new LLMConfigurationError(
      "OPENAI_API_KEY environment variable is not set",
    );
  }

  const providerName = process.env.LLM_PROVIDER ?? "openai";

  if (providerName === "gemini") {
    throw new LLMConfigurationError("Gemini LLM provider is not implemented yet");
  }

  if (!SUPPORTED_PROVIDERS.has(providerName)) {
    throw new LLMConfigurationError(`Unsupported LLM_PROVIDER: ${providerName}`);
  }

  const baseURL = process.env.OPENAI_BASE_URL;

  if (providerName === "openai-compatible" && !baseURL) {
    throw new LLMConfigurationError(
      "OPENAI_BASE_URL is required when LLM_PROVIDER is openai-compatible",
    );
  }

  return new OpenAIProvider({
    apiKey,
    defaultModel: process.env.OPENAI_MODEL,
    ...(baseURL !== undefined ? { baseURL } : {}),
  });
}
