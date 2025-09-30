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

/**
 * ========================================
 * SINGLE-POST WORKFLOW EXTRACTION
 * ========================================
 * Specialized extractors that can map tool results to schema
 */

/**
 * Extract pain point from single-post workflow
 * Handles both agent synthesis AND tool-based extraction
 */
export function extractSinglePostPainPoint(
  messages: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
  postContext: { description: string; title: string; url: string }
): {
  description: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  category?: string;
  examples?: string[];
} {
  // Try agent synthesis first
  const aiMessagesWithContent = messages
    .slice()
    .reverse()
    .filter(
      (msg: any) => msg._getType && msg._getType() === "ai" && msg.content // eslint-disable-line @typescript-eslint/no-explicit-any
    );

  for (const aiMsg of aiMessagesWithContent) {
    try {
      const parsed = parseJSON(aiMsg.content) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      // Check if it has the fields we need
      if (
        parsed.description &&
        parsed.severity &&
        parsed.confidence !== undefined
      ) {
        console.log("[Extraction] ✅ Found pain point from agent synthesis");

        return {
          description: parsed.description as string,
          severity: parsed.severity as "low" | "medium" | "high",
          confidence: parsed.confidence as number,
          category: parsed.category as string | undefined,
          examples: parsed.examples as string[] | undefined,
        };
      }
    } catch {
      // Continue
    }
  }

  // Fallback: Extract from tool results
  console.log(
    "[Extraction] No agent synthesis found, falling back to tool results..."
  );

  const toolMessages = messages.filter(
    (msg: any) => msg._getType && msg._getType() === "tool" // eslint-disable-line @typescript-eslint/no-explicit-any
  );

  for (const toolMsg of toolMessages) {
    try {
      const toolResult = JSON.parse(toolMsg.content);

      // Check if this is a pain severity tool result
      if (toolResult.severityScore !== undefined && toolResult.recommendation) {
        console.log("[Extraction] ✅ Mapping tool result to pain point schema");

        // Find the tool call that triggered this result
        const aiMsgWithToolCall = messages
          .slice()
          .reverse()
          .find(
            (
              msg: any // eslint-disable-line @typescript-eslint/no-explicit-any
            ) =>
              msg._getType &&
              msg._getType() === "ai" &&
              msg.tool_calls &&
              msg.tool_calls.length > 0
          );

        let painDescription = postContext.description;
        let examples: string[] = [];

        if (aiMsgWithToolCall?.tool_calls) {
          const toolCall = aiMsgWithToolCall.tool_calls.find(
            (tc: any) => tc.name === "analyze_pain_severity" // eslint-disable-line @typescript-eslint/no-explicit-any
          );

          if (toolCall?.args) {
            painDescription =
              toolCall.args.painDescription || postContext.description;
            examples = toolCall.args.examples || [];
          }
        }

        return {
          description: painDescription,
          severity: toolResult.recommendation as "low" | "medium" | "high",
          confidence: toolResult.severityScore / 100, // Convert 0-100 to 0-1
          examples,
        };
      }
    } catch (error) {
      console.warn("[Extraction] Failed to parse tool message:", error);
    }
  }

  throw new Error(
    "Could not extract pain point from agent response or tool results"
  );
}

/**
 * Extract product idea from single-post workflow
 * Handles both agent synthesis AND tool-based extraction
 */
export function extractSinglePostIdea(
  messages: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
  painPoint: { description: string; category: string }
): {
  name: string;
  pitch: string;
  painPoint: string;
  targetAudience: string;
  category: string;
} {
  // Strategy 1: Try agent synthesis first
  const aiMessagesWithContent = messages
    .slice()
    .reverse()
    .filter(
      (msg: any) => msg._getType && msg._getType() === "ai" && msg.content // eslint-disable-line @typescript-eslint/no-explicit-any
    );

  for (const aiMsg of aiMessagesWithContent) {
    try {
      const parsed = parseJSON(aiMsg.content) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      // Check if it has the fields we need
      if (
        parsed.name &&
        parsed.pitch &&
        parsed.targetAudience &&
        parsed.category
      ) {
        console.log("[Extraction] ✅ Found idea from agent synthesis");

        return {
          name: parsed.name as string,
          pitch: parsed.pitch as string,
          painPoint: parsed.painPoint || painPoint.description,
          targetAudience: parsed.targetAudience as string,
          category: parsed.category as string,
        };
      }
    } catch {
      // Continue
    }
  }

  // Strategy 2: Fallback - Extract from tool results and construct idea
  console.log(
    "[Extraction] No agent synthesis found, constructing idea from tool results..."
  );

  const toolMessages = messages.filter(
    (msg: any) => msg._getType && msg._getType() === "tool" // eslint-disable-line @typescript-eslint/no-explicit-any
  );

  // Find market size and competition tool results
  let marketSizeResult: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  let competitionResult: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

  for (const toolMsg of toolMessages) {
    try {
      const toolResult = JSON.parse(toolMsg.content);

      if (toolResult.marketSizeScore !== undefined) {
        marketSizeResult = toolResult;
      }

      if (toolResult.competitionScore !== undefined) {
        competitionResult = toolResult;
      }
    } catch (error) {
      console.warn("[Extraction] Failed to parse tool message:", error);
    }
  }

  // Find tool call arguments for context
  const aiMsgWithToolCalls = messages
    .slice()
    .reverse()
    .find(
      (
        msg: any // eslint-disable-line @typescript-eslint/no-explicit-any
      ) =>
        msg._getType &&
        msg._getType() === "ai" &&
        msg.tool_calls &&
        msg.tool_calls.length > 0
    );

  let targetAudience = "startups and small businesses";
  let productCategory = painPoint.category;

  if (aiMsgWithToolCalls?.tool_calls) {
    // Extract from market size tool call
    const marketSizeTool = aiMsgWithToolCalls.tool_calls.find(
      (tc: any) => tc.name === "estimate_market_size" // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    if (marketSizeTool?.args) {
      targetAudience = marketSizeTool.args.targetAudience || targetAudience;
      productCategory = marketSizeTool.args.category || productCategory;
    }

    // Extract from competition tool call
    const competitionTool = aiMsgWithToolCalls.tool_calls.find(
      (tc: any) => tc.name === "analyze_competition" // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    if (competitionTool?.args) {
      // Use product name from competition analysis if available
      if (competitionTool.args.productName) {
        console.log(
          "[Extraction] ✅ Constructed idea from tool results and tool call args"
        );

        return {
          name: competitionTool.args.productName,
          pitch: `${competitionTool.args.productName} helps ${targetAudience} overcome ${painPoint.description.toLowerCase()}. ${marketSizeResult?.reasoning || competitionResult?.reasoning || "Built for teams facing this challenge."}`,
          painPoint: painPoint.description,
          targetAudience,
          category: competitionTool.args.category || productCategory,
        };
      }
    }
  }

  // Final fallback: Generate generic but valid idea
  console.log(
    "[Extraction] ✅ Generating idea from pain point context (no tool synthesis)"
  );

  const categoryCapitalized =
    productCategory.charAt(0).toUpperCase() + productCategory.slice(1);
  const genericName = `${categoryCapitalized} Solution for ${targetAudience.split(",")[0].trim()}`;

  return {
    name: genericName,
    pitch: `Helps ${targetAudience} solve ${painPoint.description.toLowerCase()}. A ${productCategory} tool built to tackle this specific challenge.`,
    painPoint: painPoint.description,
    targetAudience,
    category: productCategory,
  };
}

/**
 * Extract score from single-post workflow
 * Handles both agent synthesis AND tool-based scoring
 */
export function extractSinglePostScore(
  messages: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
  context: {
    idea: { name: string; pitch: string; category: string };
    painPoint: { severity: string; confidence: number };
    post: { upvotes: number; numComments: number };
  }
): {
  score: number;
  breakdown: {
    painSeverity: number;
    marketSize: number;
    competition: number;
    feasibility: number;
    engagement: number;
    total: number;
    reasoning: string;
  };
} {
  // Strategy 1: Try agent synthesis first
  const aiMessagesWithContent = messages
    .slice()
    .reverse()
    .filter(
      (msg: any) => msg._getType && msg._getType() === "ai" && msg.content // eslint-disable-line @typescript-eslint/no-explicit-any
    );

  for (const aiMsg of aiMessagesWithContent) {
    try {
      const parsed = parseJSON(aiMsg.content) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      // Check if it has the fields we need
      if (parsed.score !== undefined && parsed.breakdown) {
        console.log("[Extraction] ✅ Found score from agent synthesis");

        return {
          score: parsed.score as number,
          breakdown: parsed.breakdown,
        };
      }
    } catch {
      // Continue
    }
  }

  // Strategy 2: Fallback - Extract from tool results and calculate score
  console.log(
    "[Extraction] No agent synthesis found, calculating score from tool results..."
  );

  const toolMessages = messages.filter(
    (msg: any) => msg._getType && msg._getType() === "tool" // eslint-disable-line @typescript-eslint/no-explicit-any
  );

  // Find tool results
  let painSeverityResult: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  let marketSizeResult: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  let competitionResult: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

  for (const toolMsg of toolMessages) {
    try {
      const toolResult = JSON.parse(toolMsg.content);

      if (toolResult.severityScore !== undefined) {
        painSeverityResult = toolResult;
      }

      if (toolResult.marketSizeScore !== undefined) {
        marketSizeResult = toolResult;
      }

      if (toolResult.competitionScore !== undefined) {
        competitionResult = toolResult;
      }
    } catch (error) {
      console.warn("[Extraction] Failed to parse tool message:", error);
    }
  }

  // Calculate component scores
  // Pain Severity: 0-30 (based on tool result if available, else from painPoint.severity)
  let painSeverity = 15; // Default medium

  if (painSeverityResult?.severityScore !== undefined) {
    painSeverity = Math.min((painSeverityResult.severityScore * 30) / 100, 30);
  } else {
    // Fallback to pain point severity
    if (context.painPoint.severity === "high") painSeverity = 25;
    else if (context.painPoint.severity === "medium") painSeverity = 15;
    else painSeverity = 8;
  }

  // Market Size: 0-25
  let marketSize = 12; // Default medium

  if (marketSizeResult?.marketSizeScore !== undefined) {
    marketSize = Math.min((marketSizeResult.marketSizeScore * 25) / 100, 25);
  } else {
    // Simple category-based estimation
    const largeMarketCategories = [
      "marketing",
      "sales",
      "productivity",
      "financial",
    ];
    const categoryLower = context.idea.category.toLowerCase();

    if (largeMarketCategories.some((cat) => categoryLower.includes(cat))) {
      marketSize = 18;
    } else {
      marketSize = 10;
    }
  }

  // Competition: 0-20 (higher = less competition = better)
  let competition = 10; // Default medium

  if (competitionResult?.competitionScore !== undefined) {
    competition = Math.min((competitionResult.competitionScore * 20) / 100, 20);
  } else {
    // Default based on category
    const oversaturatedCategories = [
      "task manager",
      "note taking",
      "calendar",
      "todo",
    ];
    const categoryLower = context.idea.category.toLowerCase();

    if (oversaturatedCategories.some((cat) => categoryLower.includes(cat))) {
      competition = 6; // High competition
    } else {
      competition = 14; // Moderate competition
    }
  }

  // Feasibility: 0-15 (based on category complexity)
  let feasibility = 10; // Default

  const simpleCategoryKeywords = ["tool", "dashboard", "tracker", "calculator"];
  const complexCategoryKeywords = ["ai", "ml", "platform", "marketplace"];
  const categoryLower = context.idea.category.toLowerCase();

  if (simpleCategoryKeywords.some((kw) => categoryLower.includes(kw))) {
    feasibility = 14;
  } else if (complexCategoryKeywords.some((kw) => categoryLower.includes(kw))) {
    feasibility = 7;
  } else {
    feasibility = 10;
  }

  // Engagement: 0-10 (based on post metrics)
  let engagement = 5; // Default

  const upvotes = context.post.upvotes || 0;
  const comments = context.post.numComments || 0;

  if (upvotes > 50 || comments > 30) {
    engagement = 9;
  } else if (upvotes > 20 || comments > 10) {
    engagement = 7;
  } else if (upvotes > 5 || comments > 3) {
    engagement = 5;
  } else {
    engagement = 3;
  }

  // Calculate total
  const total = Math.round(
    painSeverity + marketSize + competition + feasibility + engagement
  );

  // Generate reasoning
  const reasoningParts: string[] = [];

  reasoningParts.push(
    `Pain severity is ${context.painPoint.severity} (${painSeverity.toFixed(1)}/30)`
  );
  reasoningParts.push(
    `Market size estimated at ${marketSize > 18 ? "large" : marketSize > 12 ? "medium" : "small"} (${marketSize.toFixed(1)}/25)`
  );
  reasoningParts.push(
    `Competition is ${competition > 14 ? "low" : competition > 10 ? "moderate" : "high"} (${competition.toFixed(1)}/20)`
  );

  const reasoning = reasoningParts.join(". ") + ".";

  console.log(
    "[Extraction] ✅ Calculated score from tool results and context:",
    total
  );

  return {
    score: total,
    breakdown: {
      painSeverity: Math.round(painSeverity * 10) / 10,
      marketSize: Math.round(marketSize * 10) / 10,
      competition: Math.round(competition * 10) / 10,
      feasibility: Math.round(feasibility * 10) / 10,
      engagement: Math.round(engagement * 10) / 10,
      total,
      reasoning,
    },
  };
}
