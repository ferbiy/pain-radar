import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { SystemMessage } from "@langchain/core/messages";
import {
  WorkflowConfig,
  AgentResult,
  ProcessingStats,
  WorkflowData,
  NodeResult,
  PainPoint,
  ProductIdeaLocal,
} from "@/types/workflow";
import { RedditPost } from "@/types/reddit";
import { nanoid } from "nanoid";

/**
 * Create workflow data message - stores our workflow state in message content
 */
export function createWorkflowDataMessage(data: {
  workflowId: string;
  currentStep: string;
  redditPosts?: RedditPost[];
  painPoints?: PainPoint[];
  ideas?: ProductIdeaLocal[];
  errors?: string[];
  processingStats?: ProcessingStats;
}): SystemMessage {
  return new SystemMessage({
    content: JSON.stringify({
      type: "workflow_data",
      ...data,
    }),
  });
}

/**
 * Extract workflow data from messages
 */
export function extractWorkflowData(
  messages: typeof MessagesAnnotation.State.messages
): WorkflowData | null {
  // Find the latest workflow data message
  const workflowMessage = [...messages].reverse().find((msg) => {
    try {
      const content =
        typeof msg.content === "string" ? JSON.parse(msg.content) : msg.content;

      return content?.type === "workflow_data";
    } catch {
      return false;
    }
  });

  if (!workflowMessage) {
    return null;
  }

  try {
    const content =
      typeof workflowMessage.content === "string"
        ? JSON.parse(workflowMessage.content)
        : workflowMessage.content;

    return content;
  } catch {
    return null;
  }
}

/**
 * Supervisor node - initializes and validates the workflow
 */
async function supervisorNode(
  state: typeof MessagesAnnotation.State
): Promise<NodeResult> {
  console.log("[Supervisor] Processing workflow initialization");

  const workflowData = extractWorkflowData(state.messages);
  const workflowId = workflowData?.workflowId || nanoid();

  // Create updated workflow data
  const updatedData = createWorkflowDataMessage({
    workflowId,
    currentStep: "extracting",
    redditPosts: workflowData?.redditPosts || [],
    painPoints: [],
    ideas: [],
    errors: workflowData?.errors || [],
  });

  console.log(
    `[Supervisor] Initialized workflow ${workflowId} with ${workflowData?.redditPosts?.length || 0} posts`
  );

  return {
    messages: [updatedData],
  };
}

/**
 * Pain extractor node - extracts pain points from Reddit data
 */
async function painExtractorNode(
  state: typeof MessagesAnnotation.State
): Promise<NodeResult> {
  console.log("[Pain Extractor] Processing pain point extraction");

  const workflowData = extractWorkflowData(state.messages);

  if (!workflowData) {
    throw new Error("No workflow data found");
  }

  // For now, create mock pain points (we'll implement real extraction in Task 5.3)
  const mockPainPoints: PainPoint[] = [
    {
      id: nanoid(),
      description: "Difficulty finding qualified developers",
      severity: "high",
      category: "hiring",
      source: workflowData.redditPosts?.[0]?.url || "",
      examples: ["can't find anyone good", "market is so competitive"],
      confidence: 0.8,
      frequency: 1,
    },
  ];

  const updatedData = createWorkflowDataMessage({
    ...workflowData,
    currentStep: "generating",
    painPoints: mockPainPoints,
  });

  console.log(
    `[Pain Extractor] Extracted ${mockPainPoints.length} pain points`
  );

  return {
    messages: [updatedData],
  };
}

/**
 * Idea generator node - generates product ideas from pain points
 */
async function ideaGeneratorNode(
  state: typeof MessagesAnnotation.State
): Promise<NodeResult> {
  console.log("[Idea Generator] Processing idea generation");

  const workflowData = extractWorkflowData(state.messages);

  if (!workflowData) {
    throw new Error("No workflow data found");
  }

  // For now, create mock ideas (we'll implement real generation in Task 5.4)
  const mockIdeas: ProductIdeaLocal[] = [
    {
      id: nanoid(),
      name: "DevMatch Pro",
      pitch:
        "AI-powered platform that matches startups with pre-vetted developers based on technical skills and cultural fit.",
      painPoint: "Difficulty finding qualified developers",
      targetAudience: "Early-stage startups and small businesses",
      category: "HR Tech",
      sources: [workflowData.redditPosts?.[0]?.url || ""],
      score: 0, // Will be filled by scorer
      generatedAt: new Date(),
      confidence: 0.85,
    },
  ];

  const updatedData = createWorkflowDataMessage({
    ...workflowData,
    currentStep: "scoring",
    ideas: mockIdeas,
  });

  console.log(`[Idea Generator] Generated ${mockIdeas.length} ideas`);

  return {
    messages: [updatedData],
  };
}

/**
 * Scoring node - scores the generated ideas
 */
async function scoringNode(
  state: typeof MessagesAnnotation.State
): Promise<NodeResult> {
  console.log("[Scorer] Processing idea scoring");

  const workflowData = extractWorkflowData(state.messages);

  if (!workflowData) {
    throw new Error("No workflow data found");
  }

  // For now, add mock scores (we'll implement real scoring in Task 5.5)
  const scoredIdeas = (workflowData.ideas || []).map(
    (idea: ProductIdeaLocal): ProductIdeaLocal => ({
      ...idea,
      score: 75, // Mock score
      scoreBreakdown: {
        painSeverity: 25,
        marketSize: 20,
        competition: 15,
        feasibility: 10,
        engagement: 5,
        total: 75,
        reasoning:
          "High demand for developer matching solutions with moderate competition",
      },
    })
  );

  const processingStats: ProcessingStats = {
    postsProcessed: workflowData.redditPosts?.length || 0,
    painPointsExtracted: workflowData.painPoints?.length || 0,
    ideasGenerated: scoredIdeas.length,
    averageScore:
      scoredIdeas.length > 0
        ? scoredIdeas.reduce(
            (sum: number, idea: ProductIdeaLocal) => sum + idea.score,
            0
          ) / scoredIdeas.length
        : 0,
    processingTimeMs: Date.now() - (workflowData.startTime || Date.now()),
  };

  const updatedData = createWorkflowDataMessage({
    ...workflowData,
    currentStep: "complete",
    ideas: scoredIdeas,
    processingStats,
  });

  console.log(
    `[Scorer] Scored ${scoredIdeas.length} ideas with average score ${processingStats.averageScore}`
  );

  return {
    messages: [updatedData],
  };
}

/**
 * Create and configure the LangGraph workflow using MessagesAnnotation
 */
export function createWorkflow(
  config: Partial<WorkflowConfig> = {}
): ReturnType<typeof StateGraph.prototype.compile> {
  // Config will be used in future iterations
  console.log("[Workflow] Creating workflow with config:", config);
  // Initialize the StateGraph with MessagesAnnotation (as per LangGraph.js docs)
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("supervisor", supervisorNode)
    .addNode("pain_extractor", painExtractorNode)
    .addNode("idea_generator", ideaGeneratorNode)
    .addNode("scorer", scoringNode)
    .addEdge("__start__", "supervisor")
    .addEdge("supervisor", "pain_extractor")
    .addEdge("pain_extractor", "idea_generator")
    .addEdge("idea_generator", "scorer")
    .addEdge("scorer", "__end__");

  return workflow.compile();
}

/**
 * Execute the complete AI workflow
 * Takes Reddit posts and returns scored product ideas
 */
export async function runIdeaGenerationWorkflow(
  redditPosts: RedditPost[],
  config?: Partial<WorkflowConfig>
): Promise<AgentResult<WorkflowData>> {
  const startTime = Date.now();
  const workflowId = nanoid();

  console.log(`[Workflow] Starting idea generation workflow ${workflowId}`);
  console.log(`[Workflow] Processing ${redditPosts.length} Reddit posts`);

  try {
    // Create the workflow
    const workflow = createWorkflow(config);

    // Initialize the workflow with Reddit data in a message
    const initialData = createWorkflowDataMessage({
      workflowId,
      currentStep: "initializing",
      redditPosts,
      painPoints: [],
      ideas: [],
      errors: [],
    });

    // Execute the workflow
    console.log(`[Workflow] Executing workflow...`);
    const result = await workflow.invoke({
      messages: [initialData],
    });

    // Extract final workflow data from the result
    const finalWorkflowData = extractWorkflowData(result.messages);
    const processingTimeMs = Date.now() - startTime;

    // Log results
    console.log(`[Workflow] Workflow ${workflowId} completed successfully`);
    console.log(
      `[Workflow] Generated ${finalWorkflowData?.ideas?.length || 0} ideas in ${processingTimeMs}ms`
    );

    if (finalWorkflowData?.errors && finalWorkflowData.errors.length > 0) {
      console.warn(
        `[Workflow] Workflow completed with ${finalWorkflowData.errors.length} errors:`,
        finalWorkflowData.errors
      );
    }

    return {
      success: (finalWorkflowData?.errors?.length || 0) === 0,
      data: finalWorkflowData || undefined,
      processingTimeMs,
    };
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown workflow error";

    console.error(`[Workflow] Workflow ${workflowId} failed:`, error);

    return {
      success: false,
      error: errorMessage,
      processingTimeMs,
    };
  }
}

/**
 * Helper function to create a test workflow with mock data
 */
export async function testWorkflow(): Promise<AgentResult<WorkflowData>> {
  const mockRedditPosts: RedditPost[] = [
    {
      id: "test1",
      subreddit: "startups",
      title: "Struggling to find good developers for my startup",
      content:
        "I've been trying to hire developers for months but can't find anyone good. The market is so competitive and everyone wants crazy salaries.",
      url: "https://reddit.com/r/startups/test1",
      score: 45,
      numComments: 23,
      created: new Date(),
    },
    {
      id: "test2",
      subreddit: "entrepreneur",
      title: "Marketing is so expensive, need better alternatives",
      content:
        "Spent $10k on Facebook ads with terrible ROI. There has to be a better way to reach customers without breaking the bank.",
      url: "https://reddit.com/r/entrepreneur/test2",
      score: 67,
      numComments: 34,
      created: new Date(),
    },
  ];

  return runIdeaGenerationWorkflow(mockRedditPosts, { debug: true });
}
