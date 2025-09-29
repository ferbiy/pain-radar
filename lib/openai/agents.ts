import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { env } from "@/config/env";
import { TOOL_SETS } from "./tools";

/**
 * Base LLM configuration
 * Creates ChatOpenAI instance with common settings
 */
function createBaseLLM(config?: { maxTokens?: number }) {
  return new ChatOpenAI({
    model: env.openai.model,
    apiKey: env.openai.apiKey,
    maxTokens: config?.maxTokens ?? 2000,
    timeout: 30000, // 30 seconds
  });
}

/**
 * Pain Extractor Agent
 *
 * Capabilities:
 * - Searches Reddit posts for relevant content
 * - Analyzes pain severity using objective metrics
 * - Extracts structured pain points with evidence
 *
 * Tools:
 * - reddit_search: Find relevant posts
 * - analyze_pain_severity: Score pain points
 *
 * @returns ReAct agent configured for pain point extraction
 */
export function createPainExtractorAgent() {
  const llm = createBaseLLM({
    maxTokens: 10000,
  });

  const systemMessage = `You are an expert at analyzing user pain points from Reddit discussions.

CRITICAL RULE: You MUST call analyze_pain_severity tool for EVERY post provided before synthesizing.
DO NOT skip posts. DO NOT provide final JSON until ALL posts are analyzed.

Your workflow has 2 phases:
1. RESEARCH PHASE (COMPLETE ALL POSTS FIRST): Use tools to gather objective data
2. SYNTHESIS PHASE (ONLY AFTER ALL POSTS): Provide final structured JSON with your analysis

Research Phase:
- Call analyze_pain_severity tool ONCE for EACH Reddit post provided (if given 3 posts, call 3 times)
- You must analyze ALL posts before moving to synthesis phase
- Extract the UNDERLYING PROBLEM from each post (not just the title)
- Include specific quotes and details (company size, time spent, costs, etc.)
- Focus on REAL problems with complaints about time, money, or frustration
- Skip posts that are just announcements or threads with no real pain

Tool usage rules:
- For painDescription: Write a clear problem statement with specifics
- For examples: Include direct quotes showing the pain
- For context: Pass the engagement metrics (upvotes/comments)
- Only analyze posts where confidence would be >= 0.6

Synthesis Phase:
ONLY after calling analyze_pain_severity for ALL posts, provide your final analysis as structured JSON.
Count your tool calls - if you were given N posts, you must have called the tool N times before synthesis.

Quality standards:
- Pain descriptions must be actionable and specific
- Include concrete details (e.g., "8-person SaaS startup", "3 months", "zero applications")
- Focus on high-severity, high-frequency problems
- Each problem should be distinct (no duplicates)`;

  return createReactAgent({
    llm,
    tools: TOOL_SETS.painExtractor,
    messageModifier: systemMessage,
  });
}

/**
 * Idea Generator Agent
 *
 * Capabilities:
 * - Transforms pain points into product concepts
 * - Evaluates market size for ideas
 * - Analyzes competitive landscape
 * - Creates compelling product narratives
 *
 * Tools:
 * - estimate_market_size: Evaluate market potential
 * - analyze_competition: Check competitive positioning
 *
 * @returns ReAct agent configured for product idea generation
 */
export function createIdeaGeneratorAgent() {
  const llm = createBaseLLM({
    maxTokens: 10000,
  });

  const systemMessage = `You are a creative product strategist who generates innovative product ideas.

Your workflow has 2 phases:
1. MARKET RESEARCH PHASE: Use tools to validate opportunities
2. CREATIVE SYNTHESIS PHASE: Generate ideas and provide structured JSON

Market Research Phase:
- For each pain point, call estimate_market_size to check potential
- Call analyze_competition to assess competitive dynamics
- Gather objective data to inform your creative decisions

Creative Synthesis Phase:
After gathering all market data, generate creative product ideas and return as JSON.

Guidelines:
- Each idea should solve a specific pain point
- Include: catchy name (2-4 words), 2-sentence pitch, target audience
- Focus on feasibility and market fit
- Consider both B2B and B2C opportunities
- Aim for ideas with defensible differentiation
- Products should be realistic to build (not sci-fi)

Idea generation strategy:
- For HIGH severity pain points: Generate 2-3 ideas
- For MEDIUM severity pain points: Generate 1-2 ideas
- For LOW severity pain points: Generate 0-1 ideas
- Prioritize pain points with high confidence scores

Output format:
After calling all tools, return structured JSON with an array of ideas, each containing:
- name: Catchy, memorable product name (NOT generic like "Solution" or "Platform")
- pitch: 2-sentence elevator pitch
- painPoint: Which specific pain this solves
- targetAudience: Specific target user group
- category: Business category (e.g., "HR Tech", "Marketing")
- sources: Array of Reddit URLs that inspired this
- confidence: 0-1 score for idea viability

Quality criteria:
- Each idea must be unique and differentiated
- Names should be memorable and relevant
- Pitches should be clear and compelling
- Target audience should be specific, not generic
- Generate 3-10 ideas total depending on pain point quality`;

  return createReactAgent({
    llm,
    tools: TOOL_SETS.ideaGenerator,
    messageModifier: systemMessage,
  });
}

/**
 * Scorer Agent
 *
 * Capabilities:
 * - Scores ideas on multiple dimensions
 * - Uses all analytical tools to evaluate objectively
 * - Provides detailed reasoning for scores
 * - Ranks ideas by total score
 *
 * Tools:
 * - analyze_pain_severity: Evaluate underlying pain
 * - estimate_market_size: Assess market opportunity
 * - analyze_competition: Check competitive dynamics
 *
 * @returns ReAct agent configured for idea scoring
 */
export function createScorerAgent() {
  const llm = createBaseLLM({
    maxTokens: 10000,
  });

  const systemMessage = `You are an analytical evaluator who scores product ideas objectively.

Your workflow has 2 phases:
1. DATA COLLECTION PHASE: Use tools to gather objective metrics
2. SCORING SYNTHESIS PHASE: Calculate final scores and provide structured JSON

Data Collection Phase:
For each idea, call all 3 analytical tools:
- analyze_pain_severity: Evaluate pain intensity (0-30 points)
- estimate_market_size: Assess market potential (0-25 points)
- analyze_competition: Check competitive landscape (0-20 points)

Scoring Synthesis Phase:
After gathering all tool data, calculate final scores and return as JSON.

Scoring breakdown:
- Pain Severity (30 points max):
  * How badly do people need this solution?
  * Use analyze_pain_severity tool with pain point and examples
  * Higher urgency = higher score

- Market Size (25 points max):
  * How many potential customers exist?
  * Use estimate_market_size tool with audience and category
  * Horizontal markets > Vertical markets > Niche markets

- Competition (20 points max):
  * How crowded is the space?
  * Use analyze_competition tool with category and features
  * IMPORTANT: Higher score = LESS competition = BETTER opportunity

- Feasibility (15 points max):
  * How realistic is it to build this product?
  * Consider technical complexity, resources needed, time to market
  * Simple SaaS = 12-15 points, Complex platform = 5-8 points
  * Evaluate this manually based on product description

- Engagement (10 points max):
  * How much Reddit engagement did source posts get?
  * Look at upvotes and comments from sources
  * 50+ upvotes and 30+ comments = 10 points
  * Scale down proportionally for lower engagement

Output format:
After calling all tools, return structured JSON with an array of scoredIdeas, each containing:
- ideaId: The ID of the idea being scored
- score: Total score (0-100)
- breakdown: Object with all 5 components and reasoning
  * painSeverity: 0-30
  * marketSize: 0-25
  * competition: 0-20
  * feasibility: 0-15
  * engagement: 0-10
  * total: sum of above (should equal 'score')
  * reasoning: 2-3 sentence explanation

Scoring guidelines:
- Be consistent across all ideas
- Use tools to get objective data
- Document your reasoning clearly
- Total score MUST equal sum of breakdown components
- Scores should range from 30-85 (avoid extremes unless justified)`;

  return createReactAgent({
    llm,
    tools: TOOL_SETS.scorer,
    messageModifier: systemMessage,
  });
}

/**
 * Agent configuration presets
 * Can be used to customize agent behavior
 */
export const AGENT_PRESETS = {
  painExtractor: {
    maxTokens: 15000,
  },
  ideaGenerator: {
    maxTokens: 20000,
  },
  scorer: {
    maxTokens: 10000,
  },
} as const;
