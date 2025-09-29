import { NextRequest, NextResponse } from "next/server";
import { runIdeaGenerationWorkflow } from "@/agents/workflow";
import { RedditService } from "@/services/reddit";

/**
 * Test endpoint for AI Workflow with real Reddit data
 * GET /api/test-workflow - Test with default subreddit (startups)
 * POST /api/test-workflow - Test with custom subreddit
 */
export async function GET(): Promise<NextResponse> {
  try {
    const subreddit = "startups";
    const limit = 5;

    console.log(
      `[Test Workflow] Fetching real data from r/${subreddit} (${limit} posts)`
    );

    // Fetch real Reddit data
    const redditService = new RedditService();
    const redditPosts = await redditService.fetchTrendingPosts(
      subreddit,
      limit
    );

    if (redditPosts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No posts found in r/${subreddit}`,
          debug: {
            message: "No Reddit data available",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    console.log(
      `[Test Workflow] Running workflow with ${redditPosts.length} posts`
    );

    // Run workflow with real data
    const result = await runIdeaGenerationWorkflow(redditPosts, {
      env: "dev",
    });

    return NextResponse.json({
      success: result.success,
      data: {
        workflowId: result.data?.workflowId,
        threadId: result.data?.threadId,
        currentStep: result.data?.currentStep,
        processingStats: result.data?.processingStats,
        painPointsCount: result.data?.painPoints?.length || 0,
        ideasCount: result.data?.ideas?.length || 0,
        errorsCount: result.data?.errors?.length || 0,
        errors: result.data?.errors || [],

        // Sample data for debugging
        samplePainPoints: result.data?.painPoints?.slice(0, 2) || [],
        sampleIdeas: result.data?.ideas?.slice(0, 2) || [],
      },
      processingTimeMs: result.processingTimeMs,
      debug: {
        message: `Workflow completed with ${redditPosts.length} posts from r/${subreddit}`,
        subreddit,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Test Workflow] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        debug: {
          message: "Workflow test failed",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Test workflow with real Reddit data
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { subreddit = "startups", limit = 5 } = body;

    console.log(
      `[Test Workflow] Starting workflow test with real Reddit data from r/${subreddit}`
    );

    // Fetch real Reddit data
    const redditService = new RedditService();
    const redditPosts = await redditService.fetchTrendingPosts(
      subreddit,
      limit
    );

    if (redditPosts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No posts found in r/${subreddit}`,
          debug: {
            message: "No Reddit data to process",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Run the workflow
    const result = await runIdeaGenerationWorkflow(redditPosts, {
      env: "dev",
    });

    return NextResponse.json({
      success: result.success,
      data: {
        workflowId: result.data?.workflowId,
        currentStep: result.data?.currentStep,
        processingStats: result.data?.processingStats,
        painPointsCount: result.data?.painPoints.length || 0,
        ideasCount: result.data?.ideas.length || 0,
        errorsCount: result.data?.errors.length || 0,
        errors: result.data?.errors || [],

        // Sample data for debugging
        samplePainPoints: result.data?.painPoints?.slice(0, 3) || [],
        sampleIdeas: result.data?.ideas?.slice(0, 3) || [],
      },
      processingTimeMs: result.processingTimeMs,
      debug: {
        message: `Workflow completed with ${redditPosts.length} Reddit posts`,
        subreddit,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Test Workflow] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        debug: {
          message: "Workflow test with real data failed",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
