import { NextResponse } from "next/server";
import { enqueueCoordinatorJob } from "@/lib/queue/operations";

/**
 * Enqueue a new idea generation coordinator job
 * POST /api/queue/enqueue
 *
 * This creates a coordinator job that will:
 * 1. Fetch Reddit posts
 * 2. Spawn individual post_processor jobs for each post
 * 3. Each post_processor job generates 1 idea
 *
 * Note: User authentication is optional for this endpoint
 */
export async function POST() {
  try {
    // Enqueue the coordinator job
    const jobId = await enqueueCoordinatorJob();

    return NextResponse.json({
      success: true,
      jobId,
      jobType: "coordinator",
      message: "Coordinator job enqueued successfully",
    });
  } catch (error) {
    console.error("[Queue API] Enqueue error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to enqueue job",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
