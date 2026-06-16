import type {
  CallOpenAIResult,
  LLMCompletionRequest,
} from "@/types/llm";

export interface LLMProvider {
  readonly name: string;
  complete(request: LLMCompletionRequest): Promise<CallOpenAIResult>;
}
