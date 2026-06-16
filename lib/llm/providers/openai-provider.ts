import OpenAI from "openai";

import { LLMRequestError } from "@/lib/errors/llm-error";
import type { LLMProvider } from "@/lib/llm/llm-provider";
import type {
  CallOpenAIResult,
  LLMCompletionRequest,
} from "@/types/llm";

export interface OpenAIProviderConfig {
  readonly apiKey: string;
  readonly defaultModel?: string;
  readonly baseURL?: string;
}

const DEFAULT_MODEL = "gpt-4o-mini";

export class OpenAIProvider implements LLMProvider {
  readonly name: string;
  private readonly client: OpenAI;
  private readonly defaultModel: string;

  constructor(config: OpenAIProviderConfig) {
    this.name = config.baseURL ? "openai-compatible" : "openai";
    this.defaultModel = config.defaultModel ?? DEFAULT_MODEL;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      ...(config.baseURL !== undefined ? { baseURL: config.baseURL } : {}),
    });
  }

  async complete(request: LLMCompletionRequest): Promise<CallOpenAIResult> {
    const model = request.options?.model ?? this.defaultModel;

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: request.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        ...(request.options?.maxTokens !== undefined
          ? { max_tokens: request.options.maxTokens }
          : {}),
        ...(request.options?.temperature !== undefined
          ? { temperature: request.options.temperature }
          : {}),
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new LLMRequestError("LLM returned an empty response");
      }

      return {
        content,
        model: response.model,
        ...(response.usage
          ? {
              usage: {
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
                totalTokens: response.usage.total_tokens,
              },
            }
          : {}),
      };
    } catch (error: unknown) {
      if (error instanceof LLMRequestError) {
        throw error;
      }

      if (error instanceof OpenAI.APIError) {
        throw new LLMRequestError("LLM request failed", {
          status: error.status,
          code: error.code,
          message: error.message,
        });
      }

      throw error;
    }
  }
}
