import "dotenv/config";

import { callOpenAI } from "../lib/llm/client";
import { isLLMError } from "../lib/errors/llm-error";

async function main(): Promise<void> {
  const result = await callOpenAI(
    [{ role: "user", content: "Reply with exactly: OK" }],
    { maxTokens: 16, temperature: 0 },
  );

  console.log("OK: LLM connection successful");
  console.log(`Model: ${result.model}`);
  console.log(`Response: ${result.content.trim()}`);

  if (result.usage) {
    console.log(
      `Tokens: ${result.usage.totalTokens} (prompt ${result.usage.promptTokens}, completion ${result.usage.completionTokens})`,
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error("LLM connection test failed");

    if (isLLMError(error)) {
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
  });
