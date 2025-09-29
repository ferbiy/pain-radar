import { StateGraph } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import {
  WorkflowStateAnnotation,
  WorkflowState,
  AgentResult,
  ProcessingStats,
  WorkflowData,
  PainPoint,
  ProductIdeaLocal,
} from "@/types/workflow";
import { RedditPost } from "@/types/reddit";
import { nanoid } from "nanoid";
import {
  createPainExtractorAgent,
  createIdeaGeneratorAgent,
  createScorerAgent,
} from "@/lib/openai/agents";
import {
  PainPointSchema,
  IdeaGenerationSchema,
  ScoringSchema,
} from "@/lib/openai/schemas";
import { createCheckpointer } from "@/lib/openai/memory";
import { createThreadConfig, resumeThreadConfig } from "@/lib/openai/threading";
import { extractStructuredOutput } from "@/lib/openai/extraction";
import {
  validatePainPoint,
  validateProductIdea,
  validateScoreBreakdown,
} from "@/lib/openai/validation";
import { inferCategoryFromDescription } from "@/lib/utils/category-inference";

/**
 * Supervisor Node - Initialize and validate workflow
 * This is the entry point that validates input data
 */
async function supervisorNode(
  state: WorkflowState
): Promise<Partial<WorkflowState>> {
  console.log("[Supervisor] Initializing workflow");

  // Validate we have posts to analyze
  if (!state.redditPosts || state.redditPosts.length === 0) {
    console.error("[Supervisor] No Reddit posts provided");

    return {
      currentStep: "error",
      errors: ["No Reddit posts provided for analysis"],
    };
  }

  console.log(
    `[Supervisor] Processing ${state.redditPosts.length} Reddit posts`
  );
  console.log(`[Supervisor] Workflow ID: ${state.workflowId}`);
  console.log(`[Supervisor] Thread ID: ${state.threadId}`);

  // Proceed to extraction

  return {
    currentStep: "extracting",
  };
}

/**
 * Pain Extractor Node - Uses REAL AGENT with tools
 * Agent autonomously analyzes posts and extracts pain points
 */
async function painExtractorNode(
  state: WorkflowState
): Promise<Partial<WorkflowState>> {
  console.log("[Pain Extractor] Starting extraction with AI agent");

  try {
    // Create agent - it will use tools autonomously
    const agent = createPainExtractorAgent();

    // Prepare Reddit posts context for the agent
    const postsContext = state.redditPosts
      .slice(0, 10) // Limit for token constraints
      .map((post, idx) => {
        let context = `Post ${idx + 1}:
Subreddit: r/${post.subreddit}
Title: ${post.title}
Content: ${post.content?.substring(0, 400) || "[No content]"}${post.content && post.content.length > 400 ? "..." : ""}
Engagement: ${post.score} upvotes, ${post.numComments} comments
URL: ${post.url}`;

        // Include top comments if available (for high-engagement posts with low content)
        if (post.comments && post.comments.length > 0) {
          const topComments = post.comments
            .slice(0, 5) // Top 5 comments
            .map(
              (comment, commentIdx) =>
                `  Comment ${commentIdx + 1} (${comment.score} upvotes): ${comment.body.substring(0, 200)}${comment.body.length > 200 ? "..." : ""}`
            )
            .join("\n");

          context += `\nTop Comments:\n${topComments}`;
        }

        context += "\n---";

        return context;
      })
      .join("\n\n");

    console.log(
      `[Pain Extractor] Analyzing ${state.redditPosts.slice(0, 10).length} posts...`
    );

    // Invoke agent - it will reason and use tools as needed
    // IMPORTANT: recursionLimit allows the agent to make multiple tool calls
    // Default is often too low, causing the agent to stop after deciding to call tools
    const result = await agent.invoke(
      {
        messages: [
          new HumanMessage(
            `Analyze these ${state.redditPosts.length} Reddit posts to extract pain points.

CRITICAL: You MUST call the analyze_pain_severity tool exactly ${state.redditPosts.length} times (once per post).
DO NOT provide final JSON until you've called the tool ${state.redditPosts.length} times.

YOUR TASK HAS 2 PHASES:

PHASE 1 - Research (use tools) - REQUIRED:
Call analyze_pain_severity tool ${state.redditPosts.length} times, once for each post below.

PHASE 2 - Synthesis (provide final JSON) - ONLY AFTER PHASE 1:
After calling the tool ${state.redditPosts.length} times, return your final analysis as structured JSON.

Here are the ${state.redditPosts.length} posts you MUST analyze:
${postsContext}

PHASE 1 CHECKLIST (DO ALL OF THESE):
${state.redditPosts.map((_, idx) => `☐ Post ${idx + 1}: Call analyze_pain_severity`).join("\n")}

For each post, call analyze_pain_severity with:
- painDescription: The UNDERLYING PROBLEM people face (not just the post title)
- examples: Array of direct quotes showing this pain (use comments if available!)
- context: The upvotes/comments data from the post

IMPORTANT:
- painDescription should be a clear problem statement, not just repeating the post title
- Include specific details from the post content (e.g., "8-person SaaS startup", "3 months", etc.)
- For examples/quotes: Extract from post content OR top comments (whichever has better pain evidence)
- Only analyze posts that have real problems (skip announcement threads)

Example:
Post: "How are small startups finding good product designers?"
❌ Bad painDescription: "How are small startups finding good product designers?"
✅ Good painDescription: "Small startups (8-person SaaS) spend 3+ months failing to hire quality product designers after posting on job boards (Indeed, LinkedIn, AngelList), receiving zero or only low-quality spam applications"

PHASE 2 INSTRUCTIONS (ONLY after analyzing ALL ${state.redditPosts.length} posts):
After calling analyze_pain_severity ${state.redditPosts.length} times, return this JSON:

{
  "painPoints": [
    {
      "description": "The underlying problem",
      "severity": "low|medium|high",
      "category": "hiring|marketing|technical|productivity|financial|other",
      "examples": ["Quote 1", "Quote 2"],
      "confidence": 0.0-1.0,
      "frequency": 1,
      "sources": ["https://reddit.com/..."]
    }
  ]
}

EXECUTION ORDER:
1. Call analyze_pain_severity for Post 1
2. Call analyze_pain_severity for Post 2
3. Call analyze_pain_severity for Post 3
4. THEN (and only then) provide the final JSON with all pain points`
          ),
        ],
      },
      {
        recursionLimit: 25, // Allow agent to make multiple tool calls (3 posts + potential retries)
      }
    );

    console.log(
      `[Pain Extractor] Agent returned ${result.messages.length} messages`
    );

    // Debug: Log ALL messages to understand what agent is doing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.messages.forEach((msg: any, idx: number) => {
      const msgType = msg._getType ? msg._getType() : typeof msg;

      console.log(`[Pain Extractor] Message ${idx}: type=${msgType}`);

      if (msgType === "ai") {
        console.log(
          `[Pain Extractor] AI message ${idx} content:`,
          typeof msg.content === "string"
            ? msg.content.substring(0, 200)
            : JSON.stringify(msg.content).substring(0, 200)
        );
        console.log(
          `[Pain Extractor] AI message ${idx} has tool_calls:`,
          !!msg.tool_calls
        );
      }
    });

    // Try to extract structured output from agent's synthesis
    let painPoints: PainPoint[] = [];
    let extractionSource = "unknown";

    try {
      // Strategy 1: Extract from agent's final structured synthesis
      const { data: painPointsData, source } = extractStructuredOutput(
        result.messages,
        PainPointSchema,
        { fallbackToToolData: false }
      );

      extractionSource = source;
      console.log(`[Pain Extractor] Extracted data from: ${source}`);

      // Transform to internal format with IDs
      painPoints = painPointsData.painPoints.map((point, index) => {
        const post = state.redditPosts[index] || state.redditPosts[0];

        return {
          id: nanoid(),
          description: point.description,
          severity: point.severity as "low" | "medium" | "high",
          category: point.category || "other",
          source: post.url,
          examples: point.examples || [
            post.content?.substring(0, 200) || post.title,
          ],
          confidence: point.confidence,
          frequency: 1,
        };
      });

      console.log(
        `[Pain Extractor] Extracted ${painPoints.length} pain points from agent synthesis`
      );
    } catch (synthesisError) {
      // Strategy 2: Fallback to tool results if synthesis fails
      console.warn(
        "[Pain Extractor] Failed to extract from agent synthesis, falling back to tool results:",
        synthesisError instanceof Error
          ? synthesisError.message
          : synthesisError
      );

      const toolMessages = result.messages.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (msg: any) => msg._getType && msg._getType() === "tool"
      );

      console.log(
        `[Pain Extractor] Found ${toolMessages.length} tool messages`
      );

      if (toolMessages.length === 0) {
        console.error("[Pain Extractor] ❌ Agent is not calling tools!");
        console.error(
          "[Pain Extractor] This suggests the model or configuration doesn't support tool calling."
        );
        console.error(
          "[Pain Extractor] Check: 1) Model supports tools, 2) Tools are properly configured, 3) Agent config is correct"
        );
        throw new Error("Agent did not use any tools to analyze pain points");
      }

      extractionSource = "tool_fallback";

      // Extract from tool call ARGUMENTS (agent's analysis) + tool RESULTS (metrics)
      // Get AI messages that called tools
      const aiMessagesWithTools = result.messages.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (msg: any) =>
          msg._getType &&
          msg._getType() === "ai" &&
          msg.tool_calls &&
          msg.tool_calls.length > 0
      );

      console.log(
        `[Pain Extractor] Found ${aiMessagesWithTools.length} AI messages with tool calls`
      );

      // Track total tool call index across all AI messages
      let toolCallCounter = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      aiMessagesWithTools.forEach((aiMsg: any, msgIndex: number) => {
        // Process ALL tool calls in this AI message (agent may make multiple calls in one message)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        aiMsg.tool_calls.forEach((toolCall: any, toolCallIndex: number) => {
          try {
            const toolArgs = toolCall.args; // Agent's analysis is here!

            // Get corresponding tool result for metrics (they come back in order)
            const toolMsg = toolMessages[toolCallCounter];
            const toolResult =
              toolMsg && typeof toolMsg.content === "string"
                ? JSON.parse(toolMsg.content)
                : toolMsg?.content || {};

            // Get corresponding post for source URL
            const post =
              state.redditPosts[toolCallCounter] || state.redditPosts[0];

            console.log(
              `[Pain Extractor] Processing tool call ${toolCallCounter + 1} from AI message ${msgIndex + 1}, tool ${toolCallIndex + 1}: "${toolArgs.painDescription?.substring(0, 60)}..."`
            );

            if (
              toolResult.severityScore !== undefined &&
              toolArgs.painDescription
            ) {
              const severity =
                toolResult.severityScore > 60
                  ? "high"
                  : toolResult.severityScore > 30
                    ? "medium"
                    : "low";

              // Infer category (temporary workaround - see category-inference.ts)
              const category = inferCategoryFromDescription(
                toolArgs.painDescription
              );

              painPoints.push({
                id: nanoid(),
                description: toolArgs.painDescription, // ✅ Agent's analysis
                severity: severity as "low" | "medium" | "high",
                category: category, // ✅ Inferred from description
                source: post.url,
                examples: toolArgs.examples || [
                  post.content?.substring(0, 200) || post.title,
                ], // ✅ Agent's evidence quotes
                confidence: toolResult.confidence || 0.7,
                frequency: 1,
              });

              console.log(
                `[Pain Extractor] ✅ Extracted pain point ${toolCallCounter + 1}: "${toolArgs.painDescription.substring(0, 60)}..." (category: ${category}, severity: ${severity})`
              );
            }

            toolCallCounter++; // Move to next tool result
          } catch (error) {
            console.warn(
              `[Pain Extractor] Could not parse tool call ${toolCallCounter + 1}:`,
              error
            );
            toolCallCounter++; // Still increment to stay in sync
          }
        });
      });

      console.log(
        `[Pain Extractor] Extracted ${painPoints.length} pain points from tool fallback`
      );
    }

    // Validate pain points
    const validatedPainPoints: PainPoint[] = [];

    painPoints.forEach((point, index) => {
      const validation = validatePainPoint(point);

      if (!validation.isValid) {
        console.error(
          `[Pain Extractor] Invalid pain point ${index + 1}:`,
          validation.errors
        );
      } else {
        if (validation.warnings.length > 0) {
          console.warn(
            `[Pain Extractor] Pain point ${index + 1} warnings:`,
            validation.warnings
          );
        }
        validatedPainPoints.push(point);
      }
    });

    console.log(
      `[Pain Extractor] Validated ${validatedPainPoints.length}/${painPoints.length} pain points`
    );

    if (validatedPainPoints.length === 0) {
      throw new Error("No valid pain points extracted after validation");
    }

    console.log(
      `[Pain Extractor] Successfully extracted ${validatedPainPoints.length} pain points (source: ${extractionSource})`
    );

    return {
      currentStep: "generating",
      painPoints: validatedPainPoints,
    };
  } catch (error) {
    console.error("[Pain Extractor] Agent failed:", error);

    return {
      currentStep: "generating",
      errors: [
        `Pain extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
      painPoints: [], // Continue with empty array
    };
  }
}

/**
 * Idea Generator Node - Uses REAL AGENT with tools
 * Agent autonomously generates product ideas from pain points
 */
async function ideaGeneratorNode(
  state: WorkflowState
): Promise<Partial<WorkflowState>> {
  console.log("[Idea Generator] Generating ideas with AI agent");

  // Skip if no pain points
  if (!state.painPoints || state.painPoints.length === 0) {
    console.warn("[Idea Generator] No pain points to work with");

    return {
      currentStep: "scoring",
      ideas: [],
      errors: ["No pain points available for idea generation"],
    };
  }

  try {
    const agent = createIdeaGeneratorAgent();

    // Prepare pain points for the agent
    const painPointsContext = state.painPoints
      .map(
        (point, idx) =>
          `Pain Point ${idx + 1}:
Description: ${point.description}
Severity: ${point.severity.toUpperCase()}
Category: ${point.category}
Examples: ${point.examples.slice(0, 2).join(" | ")}
Confidence: ${(point.confidence * 100).toFixed(0)}%
Source: ${point.source}
---`
      )
      .join("\n\n");

    console.log(
      `[Idea Generator] Processing ${state.painPoints.length} pain points...`
    );

    // Invoke agent - it will use market sizing and competition tools
    const result = await agent.invoke(
      {
        messages: [
          new HumanMessage(
            `Generate creative product ideas for these pain points:

${painPointsContext}

YOUR TASK HAS 2 PHASES:

PHASE 1 - Market Research (use tools):
For each pain point, call tools to validate market opportunity:
- Call estimate_market_size: Check market potential
- Call analyze_competition: Assess competitive landscape

PHASE 2 - Creative Synthesis (provide final JSON):
After gathering all market data, generate creative product ideas and return as JSON.

PHASE 1 INSTRUCTIONS:
Call the tools for each pain point above to gather market intelligence.

PHASE 2 INSTRUCTIONS:
After calling all tools, generate creative ideas and return this JSON:

{
  "ideas": [
    {
      "name": "Catchy 2-4 word product name (NOT generic like 'Solution' or 'Platform')",
      "pitch": "Compelling 2-sentence description of what it does and why it's differentiated",
      "painPoint": "The specific pain this solves",
      "targetAudience": "Specific audience segment (e.g., 'Pre-Series A SaaS founders with 5-15 employees')",
      "category": "Business category from the pain point",
      "sources": ["Reddit URL where this pain was found"],
      "confidence": 0.0-1.0
    }
  ]
}

CREATIVITY RULES:
- Names must be memorable and unique (❌ "Hiring Solution" ✅ "DesignMatch")
- Pitches must explain HOW it solves the problem, not just repeat the pain
- Target audience must be SPECIFIC (❌ "Startups and small businesses" ✅ "8-15 person SaaS companies without in-house design")
- Generate 1-2 ideas per HIGH severity pain, 1 per MEDIUM, 0-1 per LOW
- Ideas should be feasible but innovative

Now:
1. First, call estimate_market_size and analyze_competition for each pain point
2. Then, provide the final JSON above with your creative product ideas`
          ),
        ],
      },
      {
        recursionLimit: 25, // Allow agent to call multiple tools for validation
      }
    );

    console.log(
      `[Idea Generator] Agent returned ${result.messages.length} messages`
    );

    // Try to extract agent's creative synthesis using the updated extraction helper
    let ideas: ProductIdeaLocal[] = [];
    let extractionSource = "agent_synthesis";

    try {
      console.log(
        "[Idea Generator] Attempting to extract from agent synthesis..."
      );

      // Use the same extraction helper as Pain Extractor (handles partial JSON)
      const { data: ideasData, source } = extractStructuredOutput(
        result.messages,
        IdeaGenerationSchema,
        { fallbackToToolData: false }
      );

      extractionSource = source;

      // Convert to internal format
      ideas = ideasData.ideas.map((idea) => ({
        id: nanoid(),
        name: idea.name,
        pitch: idea.pitch,
        painPoint: idea.painPoint,
        targetAudience: idea.targetAudience,
        category: idea.category,
        sources: idea.sources,
        score: 0, // Will be filled by scorer
        generatedAt: new Date(),
        confidence: idea.confidence,
      }));

      console.log(
        `[Idea Generator] ✅ Extracted ${ideas.length} creative ideas from ${source}`
      );
    } catch (error) {
      console.warn(
        "[Idea Generator] Failed to extract from agent synthesis:",
        error
      );
      console.log("[Idea Generator] Falling back to template generation...");

      extractionSource = "template_fallback";

      // Fallback: Generate template ideas from pain points
      ideas = state.painPoints.map((painPoint) => {
        const ideaName = `${painPoint.category.charAt(0).toUpperCase() + painPoint.category.slice(1)} Solution`;

        return {
          id: nanoid(),
          name: ideaName,
          pitch: `A solution to address: ${painPoint.description}`,
          painPoint: painPoint.description,
          targetAudience: "Startups and small businesses",
          category: painPoint.category,
          sources: [painPoint.source],
          score: 0,
          generatedAt: new Date(),
          confidence: painPoint.confidence,
        };
      });

      console.log(
        `[Idea Generator] ⚠️ Generated ${ideas.length} template ideas as fallback`
      );
    }

    console.log(
      `[Idea Generator] Successfully generated ${ideas.length} ideas (source: ${extractionSource})`
    );

    // Validate product ideas
    const validatedIdeas: ProductIdeaLocal[] = [];

    ideas.forEach((idea, index) => {
      const validation = validateProductIdea(idea);

      if (!validation.isValid) {
        console.error(
          `[Idea Generator] Invalid idea ${index + 1} "${idea.name}":`,
          validation.errors
        );
      } else {
        if (validation.warnings.length > 0) {
          console.warn(
            `[Idea Generator] Idea ${index + 1} "${idea.name}" warnings:`,
            validation.warnings
          );
        }
        validatedIdeas.push(idea);
      }
    });

    console.log(
      `[Idea Generator] Validated ${validatedIdeas.length}/${ideas.length} ideas`
    );

    if (validatedIdeas.length === 0) {
      throw new Error("No valid ideas generated after validation");
    }

    return {
      currentStep: "scoring",
      ideas: validatedIdeas,
    };
  } catch (error) {
    console.error("[Idea Generator] Agent failed:", error);

    return {
      currentStep: "scoring",
      errors: [
        `Idea generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
      ideas: [],
    };
  }
}

/**
 * Scorer Node - Uses REAL AGENT with all analytical tools
 * Agent autonomously scores ideas using multiple tools
 */
async function scoringNode(
  state: WorkflowState
): Promise<Partial<WorkflowState>> {
  console.log("[Scorer] Scoring ideas with AI agent");

  if (!state.ideas || state.ideas.length === 0) {
    console.warn("[Scorer] No ideas to score");

    return {
      currentStep: "complete",
      processingStats: createProcessingStats(state, []),
    };
  }

  try {
    const agent = createScorerAgent();

    // Prepare ideas with context for scoring
    const ideasContext = state.ideas
      .map(
        (idea, idx) =>
          `Idea ${idx + 1}:
ID: ${idea.id}
Name: ${idea.name}
Pitch: ${idea.pitch}
Pain Point: ${idea.painPoint}
Target Audience: ${idea.targetAudience}
Category: ${idea.category}
Confidence: ${(idea.confidence * 100).toFixed(0)}%
Sources: ${idea.sources.join(", ")}
---`
      )
      .join("\n\n");

    // Find pain points and Reddit posts for context
    const painPointsContext = state.painPoints
      .map((p) => `- ${p.description} (${p.severity})`)
      .join("\n");

    // Get engagement stats from source posts
    const sourceEngagement = state.ideas.map((idea) => {
      const sourceUrls = idea.sources;
      const sourcePosts = state.redditPosts.filter((post) =>
        sourceUrls.includes(post.url)
      );
      const totalUpvotes = sourcePosts.reduce((sum, p) => sum + p.score, 0);
      const totalComments = sourcePosts.reduce(
        (sum, p) => sum + p.numComments,
        0
      );

      return {
        ideaId: idea.id,
        upvotes: totalUpvotes,
        comments: totalComments,
      };
    });

    console.log(`[Scorer] Scoring ${state.ideas.length} ideas...`);
    console.log(
      `[Scorer] Ideas context length: ${ideasContext.length} characters`
    );
    console.log(
      `[Scorer] Pain points context length: ${painPointsContext.length} characters`
    );

    // Invoke agent - it will use all scoring tools
    const result = await agent.invoke(
      {
        messages: [
          new HumanMessage(
            `Score these product ideas using your analytical tools:

${ideasContext}

Context - Pain Points:
${painPointsContext}

Context - Engagement Data:
${sourceEngagement.map((e) => `- Idea ${e.ideaId}: ${e.upvotes} upvotes, ${e.comments} comments`).join("\n")}

YOUR TASK HAS 2 PHASES:

PHASE 1 - Data Collection (use tools):
For each idea, call tools to gather objective scoring data:
- Call analyze_pain_severity: Evaluate the underlying pain (0-30 points)
- Call estimate_market_size: Assess market opportunity (0-25 points)
- Call analyze_competition: Check competitive dynamics (0-20 points)

PHASE 2 - Final Scoring (provide JSON):
After gathering all tool data, calculate final scores and return as JSON.

PHASE 2 SCORING RULES:
- painSeverity: Use tool's score × 0.30 (max 30 points)
- marketSize: Use tool's score × 0.25 (max 25 points)
- competition: Use tool's score × 0.20 (max 20 points)
- feasibility: Evaluate manually based on description (0-15 points)
- engagement: Use Reddit data: upvotes + comments (0-10 points)
- Total: Sum of all components (0-100)

Return this JSON structure:
{
  "scoredIdeas": [
    {
      "ideaId": "must match input ID",
      "score": 0-100,
      "breakdown": {
        "painSeverity": 0-30,
        "marketSize": 0-25,
        "competition": 0-20,
        "feasibility": 0-15,
        "engagement": 0-10,
        "total": sum,
        "reasoning": "2-3 sentence explanation citing tool findings"
      }
    }
  ]
}

Now:
1. First, call all 3 tools for each idea
2. Then, provide the final JSON above with calculated scores`
          ),
        ],
      },
      {
        recursionLimit: 15, // Lower limit to prevent timeout (3 ideas × 3 tools = 9 calls + synthesis)
      }
    );

    console.log(`[Scorer] Agent returned ${result.messages.length} messages`);

    // Try to extract agent's structured scoring synthesis
    let scoredIdeas: ProductIdeaLocal[] = [];
    let extractionSource = "agent_synthesis";

    try {
      console.log("[Scorer] Attempting to extract from agent synthesis...");

      // Use extraction helper to get agent's scores
      const { data: scoresData, source } = extractStructuredOutput(
        result.messages,
        ScoringSchema,
        { fallbackToToolData: false }
      );

      extractionSource = source;

      // Map scores back to ideas
      scoredIdeas = state.ideas.map((idea) => {
        const scoreData = scoresData.scoredIdeas.find(
          (s) => s.ideaId === idea.id
        );

        if (scoreData) {
          return {
            ...idea,
            score: scoreData.score,
            scoreBreakdown: scoreData.breakdown,
          };
        }

        // If no score found for this idea, use defaults
        return idea;
      });

      console.log(
        `[Scorer] ✅ Extracted ${scoredIdeas.length} scores from ${source}`
      );
    } catch (error) {
      console.warn(
        "[Scorer] Failed to extract from agent synthesis:",
        error instanceof Error ? error.message : error
      );
      console.log("[Scorer] Falling back to tool-based scoring...");

      extractionSource = "tool_fallback";

      // Fallback: Create scores from tool data and engagement metrics
      scoredIdeas = state.ideas.map((idea, index) => {
        // Calculate score based on available data
        const painSeverity =
          state.painPoints[index]?.severity === "high"
            ? 25
            : state.painPoints[index]?.severity === "medium"
              ? 15
              : 10;
        const marketSize = 20; // Default market size score
        const competition = 15; // Default competition score
        const feasibility = 10; // Default feasibility score
        const engagement = sourceEngagement[index]?.upvotes || 0;
        const engagementScore = Math.min(Math.floor(engagement / 10), 10);

        const totalScore =
          painSeverity +
          marketSize +
          competition +
          feasibility +
          engagementScore;

        return {
          ...idea,
          score: totalScore,
          scoreBreakdown: {
            painSeverity,
            marketSize,
            competition,
            feasibility,
            engagement: engagementScore,
            total: totalScore,
            reasoning: `Scored based on ${state.painPoints[index]?.severity} severity pain point with ${engagement} engagement`,
          },
        };
      });

      console.log(
        `[Scorer] ⚠️ Generated ${scoredIdeas.length} scores using fallback logic`
      );
    }

    // Validate score breakdowns
    const validatedScoredIdeas: ProductIdeaLocal[] = [];

    scoredIdeas.forEach((idea, index) => {
      if (idea.scoreBreakdown) {
        const validation = validateScoreBreakdown(idea.scoreBreakdown);

        if (!validation.isValid) {
          console.error(
            `[Scorer] Invalid score breakdown for idea ${index + 1} "${idea.name}":`,
            validation.errors
          );
          // Keep the idea but log the errors
          validatedScoredIdeas.push(idea);
        } else {
          if (validation.warnings.length > 0) {
            console.warn(
              `[Scorer] Score breakdown warnings for idea ${index + 1} "${idea.name}":`,
              validation.warnings
            );
          }
          validatedScoredIdeas.push(idea);
        }
      } else {
        // No score breakdown to validate
        validatedScoredIdeas.push(idea);
      }
    });

    console.log(
      `[Scorer] Validated ${validatedScoredIdeas.length}/${scoredIdeas.length} scores`
    );

    // Sort by score descending
    validatedScoredIdeas.sort((a, b) => b.score - a.score);

    console.log(
      `[Scorer] Successfully scored ${validatedScoredIdeas.length} ideas (avg: ${(validatedScoredIdeas.reduce((sum, i) => sum + i.score, 0) / validatedScoredIdeas.length).toFixed(1)}, source: ${extractionSource})`
    );

    return {
      currentStep: "complete",
      ideas: validatedScoredIdeas,
      processingStats: createProcessingStats(state, validatedScoredIdeas),
    };
  } catch (error) {
    console.error("[Scorer] Agent failed:", error);

    return {
      currentStep: "complete",
      errors: [
        `Scoring failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
      processingStats: createProcessingStats(state, state.ideas),
    };
  }
}

/**
 * Helper to create processing stats
 */
function createProcessingStats(
  state: WorkflowState,
  scoredIdeas: ProductIdeaLocal[]
): ProcessingStats {
  const avgScore =
    scoredIdeas.length > 0
      ? scoredIdeas.reduce((sum, idea) => sum + idea.score, 0) /
        scoredIdeas.length
      : 0;

  return {
    postsProcessed: state.redditPosts?.length || 0,
    painPointsExtracted: state.painPoints?.length || 0,
    ideasGenerated: scoredIdeas.length,
    averageScore: Math.round(avgScore * 10) / 10,
    processingTimeMs: Date.now() - (state.startTime || Date.now()),
  };
}

/**
 * Create the LangGraph workflow with proper state and memory
 * This uses the new WorkflowStateAnnotation and checkpointing
 */
export function createWorkflow(config?: { env?: "dev" | "prod" }) {
  console.log("[Workflow] Creating workflow with checkpointing");

  // Create checkpointer for memory persistence
  const checkpointer = createCheckpointer(config?.env || "dev");

  // Build the workflow graph with proper state
  const workflow = new StateGraph(WorkflowStateAnnotation)
    .addNode("supervisor", supervisorNode)
    .addNode("pain_extractor", painExtractorNode)
    .addNode("idea_generator", ideaGeneratorNode)
    .addNode("scorer", scoringNode)
    .addEdge("__start__", "supervisor")
    .addEdge("supervisor", "pain_extractor")
    .addEdge("pain_extractor", "idea_generator")
    .addEdge("idea_generator", "scorer")
    .addEdge("scorer", "__end__");

  // Compile with checkpointer - enables memory and state persistence
  return workflow.compile({
    checkpointer,
  });
}

/**
 * Execute the complete AI workflow with proper threading
 * Takes Reddit posts and returns scored product ideas
 */
export async function runIdeaGenerationWorkflow(
  redditPosts: RedditPost[],
  options?: {
    threadId?: string; // For resuming
    env?: "dev" | "prod";
  }
): Promise<AgentResult<WorkflowData>> {
  const startTime = Date.now();
  const workflowId = nanoid();

  // Create or reuse thread
  const threadConfig = options?.threadId
    ? resumeThreadConfig(options.threadId)
    : createThreadConfig();

  const threadId = threadConfig.configurable.thread_id;

  console.log(`[Workflow] Starting workflow ${workflowId}`);
  console.log(`[Workflow] Thread ID: ${threadId}`);
  console.log(`[Workflow] Processing ${redditPosts.length} Reddit posts`);

  try {
    // Create workflow with checkpointing
    const workflow = createWorkflow({ env: options?.env });

    // Initialize state
    const initialState: Partial<WorkflowState> = {
      workflowId,
      threadId,
      currentStep: "initializing",
      redditPosts,
      painPoints: [],
      ideas: [],
      errors: [],
      startTime,
    };

    // Execute workflow - agents will use tools autonomously
    console.log("[Workflow] Invoking workflow with AI agents...");
    const result = await workflow.invoke(initialState, threadConfig);

    const processingTimeMs = Date.now() - startTime;

    console.log(`[Workflow] Workflow completed`);
    console.log(
      `[Workflow] Generated ${result.ideas?.length || 0} ideas in ${processingTimeMs}ms`
    );
    console.log(
      `[Workflow] Thread ID ${threadId} saved in checkpoint for resume`
    );

    if (result.errors && result.errors.length > 0) {
      console.warn(
        `[Workflow] Completed with ${result.errors.length} errors:`,
        result.errors
      );
    }

    return {
      success: (result.errors?.length || 0) === 0,
      data: {
        workflowId: result.workflowId,
        threadId: result.threadId,
        currentStep: result.currentStep,
        redditPosts: result.redditPosts,
        painPoints: result.painPoints,
        ideas: result.ideas,
        errors: result.errors,
        processingStats: result.processingStats,
        startTime: result.startTime,
      },
      processingTimeMs,
    };
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;

    console.error(`[Workflow] Workflow failed:`, error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown workflow error",
      processingTimeMs,
    };
  }
}

/**
 * Resume a workflow from checkpoint using thread ID
 */
export async function resumeWorkflow(
  threadId: string,
  options?: { env?: "dev" | "prod" }
): Promise<AgentResult<WorkflowData>> {
  console.log(`[Workflow] Resuming workflow from thread ${threadId}`);

  try {
    const workflow = createWorkflow({ env: options?.env });
    const threadConfig = resumeThreadConfig(threadId);

    // Get current state from checkpoint
    const state = await workflow.getState(threadConfig);

    if (!state || !state.values) {
      throw new Error(`No checkpoint found for thread ${threadId}`);
    }

    console.log(`[Workflow] Resuming from step: ${state.values.currentStep}`);

    // Continue execution from checkpoint
    const result = await workflow.invoke(null, threadConfig);

    return {
      success: true,
      data: result as WorkflowData,
      processingTimeMs: Date.now() - (result.startTime || Date.now()),
    };
  } catch (error) {
    console.error(`[Workflow] Resume failed:`, error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Resume failed",
      processingTimeMs: 0,
    };
  }
}

// testWorkflow() removed - use real Reddit data via RedditService instead
// See app/api/test-workflow/route.ts for usage example
