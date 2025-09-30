import { z } from "zod";

/**
 * Schema for pain point extraction
 * Used by Pain Extractor Agent to return structured data
 */
export const PainPointSchema = z.object({
  painPoints: z
    .array(
      z.object({
        description: z
          .string()
          .describe("Clear, specific description of the problem or pain point"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe("Severity level of the pain point"),
        category: z
          .string()
          .describe(
            "Problem category: hiring, marketing, technical, productivity, financial, or other"
          ),
        examples: z
          .array(z.string())
          .describe("Direct quotes from Reddit posts demonstrating this pain"),
        confidence: z
          .number()
          .min(0)
          .max(1)
          .describe("AI confidence in this pain point (0-1)"),
        frequency: z
          .number()
          .int()
          .positive()
          .describe("How many times this pain appeared across posts"),
        sources: z
          .array(z.string().url())
          .describe("URLs of Reddit posts where this pain was found"),
      })
    )
    .describe("List of extracted pain points"),
});

/**
 * TypeScript type derived from schema
 */
export type PainPointOutput = z.infer<typeof PainPointSchema>;

/**
 * Schema for idea generation
 * Used by Idea Generator Agent to return structured product ideas
 */
export const IdeaGenerationSchema = z.object({
  ideas: z
    .array(
      z.object({
        name: z.string().describe("Catchy, memorable product name (2-4 words)"),
        pitch: z
          .string()
          .describe(
            "Compelling 2-sentence elevator pitch explaining what it does and why it matters"
          ),
        painPoint: z
          .string()
          .describe("The specific pain point this product solves"),
        targetAudience: z
          .string()
          .describe(
            "Specific target audience (e.g., 'early-stage startups', 'freelance developers')"
          ),
        category: z
          .string()
          .describe(
            "Business category (e.g., 'HR Tech', 'Marketing Automation', 'Developer Tools')"
          ),
        sources: z
          .array(z.string().url())
          .describe("Reddit post URLs that inspired this idea"),
        confidence: z
          .number()
          .min(0)
          .max(1)
          .describe("AI confidence in this idea's viability (0-1)"),
      })
    )
    .describe("List of generated product ideas"),
});

/**
 * TypeScript type derived from schema
 */
export type IdeaGenerationOutput = z.infer<typeof IdeaGenerationSchema>;

/**
 * Schema for scoring
 * Used by Scorer Agent to return scored ideas with breakdown
 */
export const ScoringSchema = z.object({
  scoredIdeas: z
    .array(
      z.object({
        ideaId: z
          .string()
          .describe("ID of the idea being scored (must match input ID)"),
        score: z
          .number()
          .min(0)
          .max(100)
          .describe("Total score (sum of all breakdown components)"),
        breakdown: z.object({
          painSeverity: z
            .number()
            .min(0)
            .max(30)
            .describe(
              "Pain severity score (0-30): How badly do people need this?"
            ),
          marketSize: z
            .number()
            .min(0)
            .max(25)
            .describe(
              "Market size score (0-25): How many potential customers?"
            ),
          competition: z
            .number()
            .min(0)
            .max(20)
            .describe(
              "Competition score (0-20): Higher = less competition = better"
            ),
          feasibility: z
            .number()
            .min(0)
            .max(15)
            .describe("Feasibility score (0-15): How realistic to build?"),
          engagement: z
            .number()
            .min(0)
            .max(10)
            .describe(
              "Engagement score (0-10): Based on Reddit upvotes and comments"
            ),
          total: z
            .number()
            .min(0)
            .max(100)
            .describe("Total score (should equal sum of components)"),
          reasoning: z
            .string()
            .describe("2-3 sentence explanation of the score and key factors"),
        }),
      })
    )
    .describe("List of scored ideas with detailed breakdown"),
});

/**
 * TypeScript type derived from schema
 */
export type ScoringOutput = z.infer<typeof ScoringSchema>;

/**
 * ========================================
 * SINGLE-POST WORKFLOW SCHEMAS
 * ========================================
 * Simpler schemas for processing individual posts
 * Used by runSinglePostWorkflow() to avoid array complexity
 */

/**
 * Schema for extracting a single pain point from one post
 */
export const SinglePainPointSchema = z.object({
  description: z
    .string()
    .describe("Clear, specific description of the problem or pain point"),
  severity: z
    .enum(["low", "medium", "high"])
    .describe("Severity level of the pain point"),
  category: z
    .string()
    .optional()
    .describe(
      "Problem category: hiring, marketing, technical, productivity, financial, or other"
    ),
  examples: z
    .array(z.string())
    .optional()
    .describe("Direct quotes from the Reddit post demonstrating this pain"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("AI confidence in this pain point (0-1)"),
});

export type SinglePainPointOutput = z.infer<typeof SinglePainPointSchema>;

/**
 * Schema for generating a single product idea
 */
export const SingleIdeaSchema = z.object({
  name: z.string().describe("Catchy, memorable product name (2-4 words)"),
  pitch: z
    .string()
    .describe(
      "Compelling 2-sentence elevator pitch explaining what it does and why it matters"
    ),
  painPoint: z.string().describe("The specific pain point this product solves"),
  targetAudience: z
    .string()
    .describe(
      "Specific target audience (e.g., 'early-stage startups', 'freelance developers')"
    ),
  category: z
    .string()
    .describe(
      "Business category (e.g., 'HR Tech', 'Marketing Automation', 'Developer Tools')"
    ),
});

export type SingleIdeaOutput = z.infer<typeof SingleIdeaSchema>;

/**
 * Schema for scoring a single idea
 */
export const SingleScoringSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe("Total score (sum of all breakdown components)"),
  breakdown: z.object({
    painSeverity: z
      .number()
      .min(0)
      .max(30)
      .describe("Pain severity score (0-30): How badly do people need this?"),
    marketSize: z
      .number()
      .min(0)
      .max(25)
      .describe("Market size score (0-25): How many potential customers?"),
    competition: z
      .number()
      .min(0)
      .max(20)
      .describe("Competition score (0-20): Higher = less competition = better"),
    feasibility: z
      .number()
      .min(0)
      .max(15)
      .describe("Feasibility score (0-15): How realistic to build?"),
    engagement: z
      .number()
      .min(0)
      .max(10)
      .describe(
        "Engagement score (0-10): Based on Reddit upvotes and comments"
      ),
    total: z
      .number()
      .min(0)
      .max(100)
      .describe("Total score (should equal sum of components)"),
    reasoning: z
      .string()
      .describe("2-3 sentence explanation of the score and key factors"),
  }),
});

export type SingleScoringOutput = z.infer<typeof SingleScoringSchema>;
