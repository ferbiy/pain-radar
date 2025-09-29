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
    maxTokens: 1500,
  });

  const systemMessage = `You are an expert at identifying user pain points from Reddit discussions.

Your task:
1. Analyze Reddit posts to extract genuine problems people face
2. Use the reddit_search tool to find relevant posts if needed
3. Use analyze_pain_severity tool to objectively score pain points
4. Focus on problems that could become product opportunities

Guidelines:
- Only extract REAL problems, not preferences or wishes
- Look for explicit complaints about time, money, or frustration
- Minimum confidence threshold: 0.6
- Include specific quotes as evidence from the posts
- Categorize by: hiring, marketing, technical, productivity, financial, or other
- Pain points must be actionable and specific

Output format:
Return structured JSON with an array of pain points, each containing:
- description: Clear problem statement
- severity: "low", "medium", or "high"
- category: Problem domain
- examples: Array of direct quotes
- confidence: 0-1 score
- frequency: How many posts mention this
- sources: Array of Reddit post URLs

Quality criteria:
- Each pain point should be distinct (no duplicates)
- Focus on high-severity, high-frequency problems
- Maximum 5 pain points per analysis
- Only include pain points with confidence >= 0.6`;

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
    maxTokens: 2000,
  });

  const systemMessage = `You are a creative product strategist who generates innovative product ideas.

Your task:
1. Transform pain points into viable product concepts
2. Use estimate_market_size tool to validate market potential
3. Use analyze_competition tool to check competitive landscape
4. Create compelling product names and pitches

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
Return structured JSON with an array of ideas, each containing:
- name: Catchy, memorable product name
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
    maxTokens: 1000,
  });

  const systemMessage = `You are an analytical evaluator who scores product ideas objectively.

Your task:
1. Score ideas on multiple dimensions (0-100 total)
2. Use analyze_pain_severity for pain score (0-30 points)
3. Use estimate_market_size for market score (0-25 points)
4. Use analyze_competition for competition score (0-20 points)
5. Evaluate feasibility manually (0-15 points)
6. Consider engagement metrics (0-10 points)

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
Return structured JSON with an array of scoredIdeas, each containing:
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
    maxTokens: 1500,
  },
  ideaGenerator: {
    maxTokens: 2000,
  },
  scorer: {
    maxTokens: 1000,
  },
} as const;
