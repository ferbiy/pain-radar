import { MessagesAnnotation } from "@langchain/langgraph";
import { WorkflowConfig, WorkflowData } from "@/types/workflow";
import { extractWorkflowData } from "./workflow";

/**
 * Supervisor Agent - Orchestrates the AI workflow
 * Now works with LangGraph MessagesAnnotation pattern
 *
 * Responsibilities:
 * - Initialize workflow state
 * - Validate input data
 * - Coordinate between agents
 * - Handle errors gracefully
 * - Track progress
 */
export async function supervisorAgent(
  state: typeof MessagesAnnotation.State,
  config: WorkflowConfig
): Promise<typeof MessagesAnnotation.State> {
  console.log(`[Supervisor] Starting workflow supervision`);

  try {
    // Extract workflow data from messages
    const workflowData = extractWorkflowData(state.messages);

    if (!workflowData) {
      throw new Error("No workflow data found in messages");
    }

    // Validate input data
    const validationErrors = validateInputData(workflowData);

    if (validationErrors.length > 0) {
      console.error(`[Supervisor] Validation failed:`, validationErrors);

      // Add error to workflow data and return
      return {
        messages: [...state.messages],
      };
    }

    // Check processing limits
    const limitErrors = checkProcessingLimits(workflowData, config);

    if (limitErrors.length > 0) {
      console.warn(`[Supervisor] Processing limits exceeded:`, limitErrors);
      // Don't fail, just log warnings
    }

    // Log workflow statistics
    logWorkflowStats(workflowData);

    console.log(`[Supervisor] Workflow supervision completed successfully`);

    return {
      messages: [...state.messages],
    };
  } catch (error) {
    console.error(`[Supervisor] Error:`, error);

    return {
      messages: [...state.messages],
    };
  }
}

/**
 * Validate input data for the workflow
 */
function validateInputData(workflowData: WorkflowData): string[] {
  const errors: string[] = [];

  // Check if we have Reddit posts to process
  if (!workflowData.redditPosts || workflowData.redditPosts.length === 0) {
    errors.push("No Reddit posts provided for processing");
  }

  // Validate Reddit posts structure
  if (workflowData.redditPosts) {
    workflowData.redditPosts.forEach((post, index: number) => {
      if (!post.id) {
        errors.push(`Reddit post ${index} missing ID`);
      }

      if (!post.title || post.title.trim().length === 0) {
        errors.push(`Reddit post ${index} missing or empty title`);
      }

      if (!post.subreddit) {
        errors.push(`Reddit post ${index} missing subreddit`);
      }
    });
  }

  return errors;
}

/**
 * Check if processing limits are within acceptable bounds
 */
function checkProcessingLimits(
  workflowData: WorkflowData,
  config: WorkflowConfig
): string[] {
  const warnings: string[] = [];

  // Check number of posts
  if (workflowData.redditPosts && workflowData.redditPosts.length > 50) {
    warnings.push(
      `Processing ${workflowData.redditPosts.length} posts (recommended max: 50)`
    );
  }

  // Check if we're within time limits
  if (workflowData.startTime) {
    const elapsedTime = Date.now() - workflowData.startTime;

    if (elapsedTime > config.limits.maxProcessingTime) {
      warnings.push(
        `Processing time ${elapsedTime}ms exceeds limit ${config.limits.maxProcessingTime}ms`
      );
    }
  }

  return warnings;
}

/**
 * Log workflow statistics for monitoring
 */
function logWorkflowStats(workflowData: WorkflowData): void {
  console.log(`[Supervisor] Workflow Statistics:`);
  console.log(`  - Workflow ID: ${workflowData.workflowId}`);
  console.log(`  - Current Step: ${workflowData.currentStep}`);
  console.log(`  - Reddit Posts: ${workflowData.redditPosts?.length || 0}`);
  console.log(`  - Pain Points: ${workflowData.painPoints?.length || 0}`);
  console.log(`  - Ideas: ${workflowData.ideas?.length || 0}`);
  console.log(`  - Errors: ${workflowData.errors?.length || 0}`);

  if (workflowData.startTime) {
    const elapsedTime = Date.now() - workflowData.startTime;

    console.log(`  - Elapsed Time: ${elapsedTime}ms`);
  }

  // Log subreddit distribution
  if (workflowData.redditPosts && workflowData.redditPosts.length > 0) {
    const subredditCounts = workflowData.redditPosts.reduce(
      (acc: Record<string, number>, post) => {
        acc[post.subreddit] = (acc[post.subreddit] || 0) + 1;

        return acc;
      },
      {} as Record<string, number>
    );

    console.log(`  - Subreddit Distribution:`, subredditCounts);
  }

  // Log content quality metrics
  if (workflowData.redditPosts) {
    const postsWithContent = workflowData.redditPosts.filter(
      (post) => post.content && post.content.length > 50
    );
    const averageScore =
      workflowData.redditPosts.length > 0
        ? workflowData.redditPosts.reduce(
            (sum: number, post) => sum + post.score,
            0
          ) / workflowData.redditPosts.length
        : 0;

    console.log(
      `  - Posts with substantial content: ${postsWithContent.length}/${workflowData.redditPosts.length}`
    );
    console.log(`  - Average Reddit score: ${averageScore.toFixed(1)}`);
  }
}
