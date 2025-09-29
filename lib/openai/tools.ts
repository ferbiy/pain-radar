import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Tool: Search Reddit posts by keyword
 * Agents can use this to find relevant pain points from the provided posts
 */
export const redditSearchTool = new DynamicStructuredTool({
  name: "reddit_search",
  description:
    "Search through Reddit posts for specific keywords or topics. " +
    "Use this when you need to find posts related to a specific problem or industry. " +
    "Returns matching posts with title, content, and engagement metrics.",
  schema: z.object({
    query: z.string().describe("Search query or keywords to look for"),
    subreddits: z
      .array(z.string())
      .optional()
      .describe("Specific subreddits to filter by (optional)"),
    minScore: z
      .number()
      .optional()
      .describe("Minimum upvote score to filter results (optional)"),
  }),
  func: async ({ query, subreddits, minScore }) => {
    console.log(`[Tool:RedditSearch] Searching for: "${query}"`);

    // Note: In actual implementation, this would access state.redditPosts
    // For now, we return a structure that agents can work with
    return JSON.stringify({
      query,
      filters: {
        subreddits: subreddits || "all",
        minScore: minScore || 0,
      },
      message:
        "Search would be performed on provided Reddit posts in state. " +
        "Agent should analyze posts with these criteria.",
      matches: 0,
    });
  },
});

/**
 * Tool: Analyze pain point severity
 * Helps agents score pain points objectively based on multiple factors
 */
export const painSeverityTool = new DynamicStructuredTool({
  name: "analyze_pain_severity",
  description:
    "Analyze the severity of a pain point based on multiple factors: " +
    "frequency of mentions, emotional intensity, financial impact, and time cost. " +
    "Returns a severity score (0-100) and detailed breakdown with recommendation.",
  schema: z.object({
    painDescription: z
      .string()
      .describe("Clear description of the pain point to analyze"),
    examples: z
      .array(z.string())
      .describe("Example quotes from users expressing this pain"),
    context: z.object({
      upvotes: z.number().describe("Number of upvotes on the source post"),
      comments: z.number().describe("Number of comments on the source post"),
      subreddit: z.string().describe("Subreddit where the pain was expressed"),
    }),
  }),
  func: async ({ painDescription, examples, context }) => {
    console.log(
      `[Tool:PainSeverity] Analyzing: "${painDescription.substring(0, 50)}..."`
    );

    // Scoring logic based on engagement and content
    let severityScore = 0;

    // High engagement suggests real, widespread pain
    if (context.upvotes > 50) severityScore += 30;
    else if (context.upvotes > 20) severityScore += 20;
    else severityScore += 10;

    // Many comments indicate people relate to and discuss the problem
    if (context.comments > 30) severityScore += 30;
    else if (context.comments > 10) severityScore += 20;
    else severityScore += 10;

    // Keywords indicating urgent or severe problems
    const urgentKeywords = [
      "urgent",
      "critical",
      "losing money",
      "can't afford",
      "desperate",
      "costing",
      "expensive",
      "frustrated",
      "impossible",
      "wasting time",
    ];

    const hasUrgentLanguage = examples.some((example) =>
      urgentKeywords.some((keyword) => example.toLowerCase().includes(keyword))
    );

    if (hasUrgentLanguage) severityScore += 40;

    // Cap at 100
    severityScore = Math.min(severityScore, 100);

    const recommendation =
      severityScore > 60 ? "high" : severityScore > 30 ? "medium" : "low";

    return JSON.stringify({
      severityScore,
      breakdown: {
        engagementScore: Math.min(context.upvotes + context.comments, 60),
        hasUrgentLanguage,
        keywords: urgentKeywords.filter((kw) =>
          examples.some((ex) => ex.toLowerCase().includes(kw))
        ),
      },
      recommendation,
      reasoning:
        `Based on ${context.upvotes} upvotes and ${context.comments} comments, ` +
        `${hasUrgentLanguage ? "with urgent language indicators" : "with moderate language"}, ` +
        `this pain point is rated as ${recommendation} severity.`,
    });
  },
});

/**
 * Tool: Market size estimator
 * Helps agents evaluate potential market size for product ideas
 */
export const marketSizeTool = new DynamicStructuredTool({
  name: "estimate_market_size",
  description:
    "Estimate the potential market size for a product idea based on " +
    "target audience, category, and problem scope. " +
    "Returns market size score (0-100), estimate range, and confidence level.",
  schema: z.object({
    targetAudience: z
      .string()
      .describe(
        "Who would use this product (e.g., 'startups', 'small businesses')"
      ),
    category: z
      .string()
      .describe("Product category/industry (e.g., 'HR Tech', 'Marketing')"),
    problemScope: z
      .enum(["niche", "vertical", "horizontal"])
      .describe(
        "Problem scope - niche: specific industry, vertical: one industry broad, horizontal: multiple industries"
      ),
  }),
  func: async ({ targetAudience, category, problemScope }) => {
    console.log(
      `[Tool:MarketSize] Estimating market for ${category} targeting ${targetAudience}`
    );

    let sizeScore = 0;

    // Scope is the primary driver of market size
    if (problemScope === "horizontal") sizeScore += 40;
    else if (problemScope === "vertical") sizeScore += 25;
    else sizeScore += 15;

    // Certain categories have known large, established markets
    const largeMarketCategories = [
      "hr",
      "recruiting",
      "hiring",
      "marketing",
      "finance",
      "accounting",
      "productivity",
      "sales",
      "crm",
      "analytics",
    ];

    const categoryLower = category.toLowerCase();
    const isLargeMarket = largeMarketCategories.some((cat) =>
      categoryLower.includes(cat)
    );

    if (isLargeMarket) sizeScore += 30;
    else sizeScore += 15;

    // Broader audiences = larger market
    const broadAudiences = [
      "businesses",
      "companies",
      "startups",
      "entrepreneurs",
      "teams",
    ];
    const audienceLower = targetAudience.toLowerCase();
    const isBroadAudience = broadAudiences.some((aud) =>
      audienceLower.includes(aud)
    );

    if (isBroadAudience) sizeScore += 30;
    else sizeScore += 10;

    sizeScore = Math.min(sizeScore, 100);

    let estimateRange = "";

    if (problemScope === "horizontal" && isLargeMarket) {
      estimateRange = "Large ($1B+ TAM)";
    } else if (problemScope === "vertical" || isLargeMarket) {
      estimateRange = "Medium ($100M-$1B TAM)";
    } else {
      estimateRange = "Small-Medium ($10M-$100M TAM)";
    }

    return JSON.stringify({
      marketSizeScore: sizeScore,
      estimate: estimateRange,
      confidence: problemScope === "horizontal" ? 0.8 : 0.6,
      factors: {
        scope: problemScope,
        isLargeMarketCategory: isLargeMarket,
        isBroadAudience,
      },
      reasoning:
        `${problemScope} problem scope in ${category} category ` +
        `targeting ${targetAudience} suggests ${estimateRange.toLowerCase()} market opportunity.`,
    });
  },
});

/**
 * Tool: Competition analyzer
 * Helps agents assess competitive landscape and differentiation opportunities
 */
export const competitionTool = new DynamicStructuredTool({
  name: "analyze_competition",
  description:
    "Analyze the competitive landscape for a product idea. " +
    "Considers if similar solutions exist, market saturation, and differentiation opportunities. " +
    "Returns competition score (0-100, higher = less competition = better opportunity).",
  schema: z.object({
    productName: z.string().describe("Name of the product idea"),
    category: z
      .string()
      .describe("Product category (e.g., 'Project Management', 'CRM')"),
    keyFeatures: z
      .array(z.string())
      .describe("Key unique features or differentiators of this product"),
  }),
  func: async ({ productName, category, keyFeatures }) => {
    console.log(
      `[Tool:Competition] Analyzing competition for "${productName}"`
    );

    let competitionScore = 50; // Start at neutral

    // Check for oversaturated categories
    const oversaturatedCategories = [
      "task manager",
      "note taking",
      "calendar",
      "todo list",
      "project management",
      "password manager",
    ];

    const categoryLower = category.toLowerCase();
    const isOversaturated = oversaturatedCategories.some((cat) =>
      categoryLower.includes(cat)
    );

    if (isOversaturated) {
      competitionScore = 30; // High competition
    } else {
      competitionScore = 70; // Moderate competition
    }

    // More unique features = better differentiation
    const uniquenessBonus = Math.min(keyFeatures.length * 5, 20);

    competitionScore = Math.min(competitionScore + uniquenessBonus, 100);

    const landscape = isOversaturated ? "crowded" : "moderate";
    const recommendation = isOversaturated
      ? "High competition - strong differentiation required. Focus on unique features."
      : "Moderate competition - good opportunity with clear positioning.";

    return JSON.stringify({
      competitionScore,
      landscape,
      recommendation,
      analysis: {
        isOversaturatedCategory: isOversaturated,
        uniqueFeatureCount: keyFeatures.length,
        uniquenessBonus,
      },
      reasoning:
        `${category} is a ${landscape} market. ` +
        `With ${keyFeatures.length} unique features, ` +
        `this idea has ${competitionScore > 60 ? "good" : "challenging"} competitive positioning.`,
    });
  },
});

/**
 * All tools available to agents
 * Export this if you want to give an agent access to all tools
 */
export const ALL_TOOLS = [
  redditSearchTool,
  painSeverityTool,
  marketSizeTool,
  competitionTool,
];

/**
 * Tool sets for specific agent types
 * Each agent gets only the tools relevant to their task
 */
export const TOOL_SETS = {
  painExtractor: [redditSearchTool, painSeverityTool],
  ideaGenerator: [marketSizeTool, competitionTool],
  scorer: [painSeverityTool, marketSizeTool, competitionTool],
};
