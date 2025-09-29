import { z } from "zod";

/**
 * Extracts structured data from agent responses
 * Tries multiple strategies in order of preference:
 * 1. Agent's final synthesis (preferred)
 * 2. Agent's partial synthesis (even if message also has tool_calls)
 * 3. Direct tool results (fallback)
 */
export function extractStructuredOutput<T>(
  messages: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
  schema: z.ZodSchema<T>,
  options: {
    requireToolCalls?: boolean;
    fallbackToToolData?: boolean;
  } = {}
): { data: T; source: "agent_synthesis" | "tool_results" | "fallback" } {
  // Strategy 1a: Find AI message with content but NO tool_calls (ideal case)
  const finalAIMessage = messages
    .slice()
    .reverse()
    .find(
      (msg: any) => msg._getType && msg._getType() === "ai" && !msg.tool_calls // eslint-disable-line @typescript-eslint/no-explicit-any
    );

  if (finalAIMessage?.content) {
    try {
      const parsed = parseJSON(finalAIMessage.content);
      const validated = schema.parse(parsed);

      return { data: validated, source: "agent_synthesis" };
    } catch (error) {
      console.warn(
        "[Extraction] Failed to parse complete agent synthesis:",
        error instanceof Error ? error.message : error
      );
    }
  }

  // Strategy 1b: Find ANY AI message with content (even if it has tool_calls)
  // This handles cases where agent provides JSON AND tool_calls in same message
  const aiMessagesWithContent = messages
    .slice()
    .reverse()
    .filter(
      (msg: any) => msg._getType && msg._getType() === "ai" && msg.content // eslint-disable-line @typescript-eslint/no-explicit-any
    );

  for (const aiMsg of aiMessagesWithContent) {
    try {
      const parsed = parseJSON(aiMsg.content);
      const validated = schema.parse(parsed);

      console.log(
        "[Extraction] ✅ Found JSON in AI message (may also have tool_calls)"
      );

      return { data: validated, source: "agent_synthesis" };
    } catch {
      // Continue to next message if parsing fails
      continue;
    }
  }

  // Strategy 2: Direct tool results (fallback)
  if (options.fallbackToToolData) {
    const toolMessages = messages.filter(
      (msg: any) => msg._getType && msg._getType() === "tool" // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    if (toolMessages.length > 0) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const toolData = toolMessages.map((msg: any) =>
          JSON.parse(msg.content)
        );
        const validated = schema.parse({ items: toolData });

        return { data: validated, source: "tool_results" };
      } catch (error) {
        console.warn(
          "[Extraction] Failed to parse tool results:",
          error instanceof Error ? error.message : error
        );
      }
    }
  }

  throw new Error("Could not extract structured output from agent response");
}

/**
 * Parse JSON from various formats (plain, markdown, etc.)
 */
export function parseJSON(content: string): unknown {
  // Try direct parse
  try {
    return JSON.parse(content);
  } catch {
    // Ignore and try other methods
  }

  // Try markdown code block
  const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);

  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      // Try without newlines/formatting
      const cleaned = jsonMatch[1].replace(/\n/g, " ").trim();

      return JSON.parse(cleaned);
    }
  }

  // Try finding JSON in text (more permissive)
  const jsonInText = content.match(/\{[\s\S]*\}/);

  if (jsonInText) {
    try {
      return JSON.parse(jsonInText[0]);
    } catch {
      // Ignore
    }
  }

  throw new Error("No valid JSON found in content");
}

/**
 * Extract tool messages by tool name/type
 */
export function extractToolMessagesByType(
  messages: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
): Record<string, unknown[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolMessagesByType: Record<string, any[]> = {
    pain_severity: [],
    market_size: [],
    competition: [],
    reddit_search: [],
  };

  const toolMessages = messages.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (msg: any) => msg._getType && msg._getType() === "tool"
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolMessages.forEach((msg: any) => {
    try {
      const content =
        typeof msg.content === "string" ? JSON.parse(msg.content) : msg.content;

      // Infer tool type from content structure
      if (content.severityScore !== undefined) {
        toolMessagesByType.pain_severity.push(content);
      } else if (
        content.tamEstimate !== undefined ||
        content.marketSize !== undefined
      ) {
        toolMessagesByType.market_size.push(content);
      } else if (content.competitionScore !== undefined) {
        toolMessagesByType.competition.push(content);
      } else if (Array.isArray(content) || content.posts !== undefined) {
        toolMessagesByType.reddit_search.push(content);
      }
    } catch (error) {
      console.warn("[Extraction] Failed to parse tool message:", error);
    }
  });

  return toolMessagesByType;
}
