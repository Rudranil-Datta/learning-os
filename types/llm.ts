export type ChatMessageRole = "system" | "user" | "assistant";

export interface ChatMessage {
  readonly role: ChatMessageRole;
  readonly content: string;
}

export interface CallOpenAIOptions {
  readonly model?: string;
  readonly maxTokens?: number;
  readonly temperature?: number;
}

export interface LLMUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

export interface CallOpenAIResult {
  readonly content: string;
  readonly model: string;
  readonly usage?: LLMUsage;
}

export interface LLMCompletionRequest {
  readonly messages: readonly ChatMessage[];
  readonly options?: CallOpenAIOptions;
}
