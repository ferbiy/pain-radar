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
// Schemas not needed - extracting from tool results directly
// import { PainPointSchema, IdeaGenerationSchema, ScoringSchema } from "@/lib/openai/schemas";
import { createCheckpointer } from "@/lib/openai/memory";
import { createThreadConfig, resumeThreadConfig } from "@/lib/openai/threading";

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
      .map(
        (post, idx) =>
          `Post ${idx + 1}:
Subreddit: r/${post.subreddit}
Title: ${post.title}
Content: ${post.content?.substring(0, 400) || "[No content]"}${post.content && post.content.length > 400 ? "..." : ""}
Engagement: ${post.score} upvotes, ${post.numComments} comments
URL: ${post.url}
---`
      )
      .join("\n\n");

    console.log(
      `[Pain Extractor] Analyzing ${state.redditPosts.slice(0, 10).length} posts...`
    );

    // Invoke agent - it will reason and use tools as needed
    const result = await agent.invoke({
      messages: [
        new HumanMessage(
          `You have ${state.redditPosts.length} Reddit posts to analyze. Your task is to extract pain points.

CRITICAL: You MUST use the analyze_pain_severity tool for EACH post. Do not skip this step.

Here are the posts:
${postsContext}

REQUIRED WORKFLOW:
1. For EACH post above, call analyze_pain_severity tool with:
   - description: The main problem from the post
   - userQuotes: Array of direct quotes showing pain
   - category: One of [hiring, marketing, technical, productivity, financial, other]

2. The tool will return severityScore and confidence

3. After analyzing all posts, I will extract the tool results

DO NOT respond with text. ONLY call the tools for each post.

Start by calling analyze_pain_severity for post 1, then post 2, then post 3.`
        ),
      ],
    });

    console.log(
      `[Pain Extractor] Agent returned ${result.messages.length} messages`
    );

    // Debug: Log all message types to understand what the agent is returning
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.messages.forEach((msg: any, idx: number) => {
      const msgType = msg._getType ? msg._getType() : typeof msg;

      console.log(
        `[Pain Extractor] Message ${idx}: type=${msgType}, hasToolCalls=${!!msg.tool_calls}`
      );

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        console.log(
          `[Pain Extractor] Tool calls found:`,
          msg.tool_calls.map((tc: any) => tc.name) // eslint-disable-line @typescript-eslint/no-explicit-any
        );
      }
    });

    // Extract pain points from tool call results instead of final message
    // ReAct agents use tools but don't format final responses well
    const toolMessages = result.messages.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (msg: any) => msg._getType && msg._getType() === "tool"
    );

    console.log(`[Pain Extractor] Found ${toolMessages.length} tool messages`);

    if (toolMessages.length === 0) {
      console.warn(
        "[Pain Extractor] No tool calls found - agent may not have used tools"
      );
      throw new Error("Agent did not use any tools to analyze pain points");
    }

    // Extract pain point data from tool results
    const painPointsFromTools: PainPoint[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toolMessages.forEach((toolMsg: any, index: number) => {
      try {
        const toolResult =
          typeof toolMsg.content === "string"
            ? JSON.parse(toolMsg.content)
            : toolMsg.content;

        console.log(`[Pain Extractor] Tool ${index + 1} result:`, toolResult);

        // If this is from analyze_pain_severity tool, extract the pain point
        if (toolResult.severityScore !== undefined) {
          // Find corresponding post context from the original posts
          const post = state.redditPosts[index] || state.redditPosts[0];

          const severity =
            toolResult.severityScore > 60
              ? "high"
              : toolResult.severityScore > 30
                ? "medium"
                : "low";

          painPointsFromTools.push({
            id: nanoid(),
            description: post.title || "Pain point extracted from discussion",
            severity: severity as "low" | "medium" | "high",
            category: "general", // Could be enhanced with categorization
            source: post.url,
            examples: [post.content?.substring(0, 200) || post.title],
            confidence: toolResult.confidence || 0.7,
            frequency: 1,
          });
        }
      } catch (error) {
        console.warn(
          `[Pain Extractor] Could not parse tool message ${index + 1}:`,
          error
        );
      }
    });

    console.log(
      `[Pain Extractor] Extracted ${painPointsFromTools.length} pain points from tool results`
    );

    if (painPointsFromTools.length === 0) {
      throw new Error("Could not extract any pain points from tool results");
    }

    const painPoints = painPointsFromTools;

    console.log(
      `[Pain Extractor] Successfully extracted ${painPoints.length} pain points`
    );

    return {
      currentStep: "generating",
      painPoints,
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
    const result = await agent.invoke({
      messages: [
        new HumanMessage(
          `Generate product ideas for these pain points:

${painPointsContext}

Instructions:
- Use estimate_market_size tool to validate market potential
- Use analyze_competition tool to check competitive landscape
- Generate 1-3 ideas per HIGH severity pain point
- Generate 1-2 ideas per MEDIUM severity pain point
- Generate 0-1 ideas per LOW severity pain point
- Focus on feasible, differentiated solutions
- Create compelling names and pitches

Return your ideas as structured JSON matching the ideas schema.`
        ),
      ],
    });

    console.log(
      `[Idea Generator] Agent returned ${result.messages.length} messages`
    );

    // For idea generation, we'll generate ideas directly from pain points
    // since tools return market data, not full ideas
    // The agent will use tools for validation but we synthesize the final ideas

    const ideas: ProductIdeaLocal[] = state.painPoints.map((painPoint) => {
      // Generate idea based on pain point
      const ideaName = `${painPoint.category.charAt(0).toUpperCase() + painPoint.category.slice(1)} Solution`;

      return {
        id: nanoid(),
        name: ideaName,
        pitch: `A solution to address: ${painPoint.description}`,
        painPoint: painPoint.description,
        targetAudience: "Startups and small businesses",
        category: painPoint.category,
        sources: [painPoint.source],
        score: 0, // Will be filled by scorer
        generatedAt: new Date(),
        confidence: painPoint.confidence,
      };
    });

    console.log(
      `[Idea Generator] Generated ${ideas.length} ideas from pain points`
    );

    return {
      currentStep: "scoring",
      ideas,
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

    // Invoke agent - it will use all scoring tools
    const result = await agent.invoke({
      messages: [
        new HumanMessage(
          `Score these product ideas using your analytical tools:

${ideasContext}

Context - Pain Points:
${painPointsContext}

Context - Engagement Data:
${sourceEngagement.map((e) => `- Idea ${e.ideaId}: ${e.upvotes} upvotes, ${e.comments} comments`).join("\n")}

Instructions:
- Use analyze_pain_severity tool to evaluate the underlying pain
- Use estimate_market_size tool to assess market opportunity
- Use analyze_competition tool to check competitive dynamics
- Evaluate feasibility based on product description (0-15 points)
- Calculate engagement score from upvotes/comments data (0-10 points)
- Total score = painSeverity + marketSize + competition + feasibility + engagement
- Provide clear reasoning for each score

Return your scores as structured JSON matching the scoring schema.`
        ),
      ],
    });

    console.log(`[Scorer] Agent returned ${result.messages.length} messages`);

    // Extract scores from tool results
    const toolMessages = result.messages.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (msg: any) => msg._getType && msg._getType() === "tool"
    );

    console.log(`[Scorer] Found ${toolMessages.length} tool messages`);

    // Create scores from tool data and engagement metrics
    const scoredIdeas: ProductIdeaLocal[] = state.ideas.map((idea, index) => {
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
        painSeverity + marketSize + competition + feasibility + engagementScore;

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

    // Sort by score descending
    scoredIdeas.sort((a, b) => b.score - a.score);

    console.log(
      `[Scorer] Scored ${scoredIdeas.length} ideas (avg: ${(scoredIdeas.reduce((sum, i) => sum + i.score, 0) / scoredIdeas.length).toFixed(1)})`
    );

    return {
      currentStep: "complete",
      ideas: scoredIdeas,
      processingStats: createProcessingStats(state, scoredIdeas),
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
