import { AppError } from "@/lib/errors/app-error";

export class LLMConfigurationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "LLM_CONFIGURATION_ERROR", 500, details);
  }
}

export class LLMRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "LLM_REQUEST_ERROR", 502, details);
  }
}

export function isLLMConfigurationError(
  error: unknown,
): error is LLMConfigurationError {
  return error instanceof LLMConfigurationError;
}

export function isLLMRequestError(error: unknown): error is LLMRequestError {
  return error instanceof LLMRequestError;
}

export function isLLMError(
  error: unknown,
): error is LLMConfigurationError | LLMRequestError {
  return isLLMConfigurationError(error) || isLLMRequestError(error);
}
