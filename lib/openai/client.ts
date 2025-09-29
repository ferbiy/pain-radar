import OpenAI from "openai";
import { env } from "@/config/env";

/**
 * OpenAI Client Configuration
 * Centralized OpenAI client for all AI agents
 */
export const openai = new OpenAI({
  apiKey: env.openai.apiKey,
});

/**
 * Default configuration for AI agents
 */
export const DEFAULT_AGENT_CONFIG = {
  model: env.openai.model, // "gpt-4o-mini" from env
  temperature: 0.7,
  maxTokens: 2000,
  timeout: 30000, // 30 seconds
} as const;

/**
 * Specific configurations for different agent types
 */
export const AGENT_CONFIGS = {
  painExtractor: {
    ...DEFAULT_AGENT_CONFIG,
    temperature: 0.3, // Lower temperature for more consistent extraction
    maxTokens: 1500,
  },
  ideaGenerator: {
    ...DEFAULT_AGENT_CONFIG,
    temperature: 0.8, // Higher temperature for more creativity
    maxTokens: 2000,
  },
  scorer: {
    ...DEFAULT_AGENT_CONFIG,
    temperature: 0.2, // Very low temperature for consistent scoring
    maxTokens: 1000,
  },
} as const;

/**
 * Helper function to create chat completion with error handling
 */
export async function createChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  config: typeof DEFAULT_AGENT_CONFIG = DEFAULT_AGENT_CONFIG
): Promise<{
  content: string;
  tokensUsed: number;
  processingTimeMs: number;
}> {
  const startTime = Date.now();

  try {
    const completion = await openai.chat.completions.create({
      model: config.model,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "";
    const tokensUsed = completion.usage?.total_tokens || 0;
    const processingTimeMs = Date.now() - startTime;

    return {
      content,
      tokensUsed,
      processingTimeMs,
    };
  } catch (error) {
    console.error("[OpenAI] Chat completion failed:", error);

    throw new Error(
      `OpenAI API error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Helper function to parse JSON response with error handling
 */
export function parseJsonResponse<T>(content: string, fallback: T): T {
  try {
    return JSON.parse(content) as T;
  } catch (error) {
    console.error("[OpenAI] Failed to parse JSON response:", error);
    console.debug("[OpenAI] Raw content:", content);

    return fallback;
  }
}
