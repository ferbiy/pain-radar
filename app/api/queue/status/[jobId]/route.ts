import { NextRequest, NextResponse } from "next/server";
import { getJobStatus, getQueuePosition } from "@/lib/queue/operations";

/**
 * Get job status
 * GET /api/queue/status/:jobId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Get job details
    const job = await getJobStatus(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get queue position if pending
    let queuePosition = null;

    if (job.status === "pending") {
      queuePosition = await getQueuePosition(jobId);
    }

    const response = {
      jobId: job.id,
      status: job.status,
      queuePosition,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      result: job.result,
      error: job.error,
    };

    console.log(
      `[Queue Status] Job ${jobId}: ${job.status}${
        queuePosition ? ` (position: ${queuePosition})` : ""
      }`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Queue API] Status check error:", error);

    return NextResponse.json(
      {
        error: "Failed to get job status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
