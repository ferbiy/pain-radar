import { ChatOpenAI } from "@langchain/openai";
import { env } from "@/config/env";

/**
 * OpenAI Client Configuration
 *
 * REFACTORED: This file now only contains basic configuration.
 * For agent creation, use lib/openai/agents.ts
 * For structured output, use lib/openai/schemas.ts
 */

/**
 * Create base ChatOpenAI instance
 * Used internally by agents in lib/openai/agents.ts
 */
export const createChatOpenAI = (config?: {
  maxTokens?: number;
}) => {
  return new ChatOpenAI({
    model: env.openai.model,
    apiKey: env.openai.apiKey,
    maxTokens: config?.maxTokens ?? 20000,
    timeout: 30000, // 30 seconds
  });
};

/**
 * Default configuration for AI agents
 * Kept for backward compatibility
 */
export const DEFAULT_AGENT_CONFIG = {
  model: env.openai.model,
  maxTokens: 20000,
  timeout: 30000,
} as const;

/**
 * Specific configurations for different agent types
 * @deprecated Use AGENT_PRESETS from lib/openai/agents.ts instead
 */
export const AGENT_CONFIGS = {
  painExtractor: {
    ...DEFAULT_AGENT_CONFIG,
    maxTokens: 15000,
  },
  ideaGenerator: {
    ...DEFAULT_AGENT_CONFIG,
    maxTokens: 20000,
  },
  scorer: {
    ...DEFAULT_AGENT_CONFIG,
    maxTokens: 10000,
  },
} as const;

/**
 * @deprecated No longer used. Agents now handle completions internally.
 * See lib/openai/agents.ts for proper agent creation with tools.
 *
 * This function was part of the old implementation that made direct LLM calls.
 * The new architecture uses createReactAgent which handles tool use autonomously.
 */
export async function createChatCompletion(): Promise<{
  content: string;
  tokensUsed: number;
  processingTimeMs: number;
}> {
  console.warn(
    "[OpenAI] createChatCompletion is deprecated. Use agents from lib/openai/agents.ts instead."
  );

  throw new Error(
    "createChatCompletion is deprecated. Use createPainExtractorAgent, " +
      "createIdeaGeneratorAgent, or createScorerAgent from lib/openai/agents.ts"
  );
}

/**
 * @deprecated No longer used. Use Zod schemas with structured output instead.
 * See lib/openai/schemas.ts for proper schema definitions.
 *
 * The new approach uses schema.parse() which validates and throws proper errors.
 */
export function parseJsonResponse<T>(content: string, fallback: T): T {
  console.warn(
    "[OpenAI] parseJsonResponse is deprecated. Use Zod schemas from lib/openai/schemas.ts instead."
  );

  try {
    return JSON.parse(content) as T;
  } catch (error) {
    console.error("[OpenAI] Failed to parse JSON response:", error);

    return fallback;
  }
}
