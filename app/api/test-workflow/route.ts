import { NextRequest, NextResponse } from "next/server";
import { runIdeaGenerationWorkflow, testWorkflow } from "@/agents/workflow";
import { RedditService } from "@/services/reddit";

/**
 * Test endpoint for AI Workflow
 * GET /api/test-workflow - Test with mock data
 * POST /api/test-workflow - Test with real Reddit data
 */
export async function GET(): Promise<NextResponse> {
  try {
    console.log("[Test Workflow] Starting workflow test with mock data");

    // Test with mock data
    const result = await testWorkflow();

    return NextResponse.json({
      success: result.success,
      data: {
        workflowId: result.data?.workflowId,
        currentStep: result.data?.currentStep,
        processingStats: result.data?.processingStats,
        painPointsCount: result.data?.painPoints?.length || 0,
        ideasCount: result.data?.ideas?.length || 0,
        errorsCount: result.data?.errors?.length || 0,
        errors: result.data?.errors || [],
      },
      processingTimeMs: result.processingTimeMs,
      debug: {
        message: "Workflow test completed",
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
      debug: true,
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
