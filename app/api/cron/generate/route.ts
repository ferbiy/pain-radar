import { NextRequest, NextResponse } from "next/server";
import { runIdeaGenerationWorkflow } from "@/agents/workflow";
import { RedditService } from "@/services/reddit";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Cron endpoint to generate product ideas
 * POST /api/cron/generate
 *
 * Security: Requires CRON_SECRET header
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify cron secret
    const secret = request.headers.get("x-cron-secret");

    if (!process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] Starting idea generation job");

    // Fetch Reddit posts
    const redditService = new RedditService();
    const posts = await redditService.fetchTrendingPosts("startups", 3);

    if (posts.length === 0) {
      return NextResponse.json(
        { error: "No Reddit posts found" },
        { status: 400 }
      );
    }

    console.log(`[Cron] Fetched ${posts.length} posts, running AI workflow`);

    // Run AI workflow
    const result = await runIdeaGenerationWorkflow(posts, { env: "dev" });

    if (!result.success || !result.data?.ideas) {
      return NextResponse.json(
        { error: "Workflow failed", details: result.data?.errors },
        { status: 500 }
      );
    }

    // Store ideas in Supabase
    const ideasToStore = result.data.ideas.map((idea) => ({
      name: idea.name,
      pitch: idea.pitch,
      pain_point: idea.painPoint,
      target_audience: idea.targetAudience,
      category: idea.category,
      score: idea.score,
      sources: idea.sources || [],
      score_breakdown: idea.scoreBreakdown,
      confidence: idea.confidence,
      is_new: true,
    }));

    const { data, error } = await supabaseAdmin
      .from("ideas")
      .insert(ideasToStore)
      .select();

    if (error) {
      console.error("[Cron] Database error:", error);
      return NextResponse.json(
        { error: "Failed to store ideas", details: error.message },
        { status: 500 }
      );
    }

    console.log(`[Cron] Successfully stored ${data.length} ideas`);

    return NextResponse.json({
      success: true,
      ideasGenerated: data.length,
      processingTime: result.processingTimeMs,
      ideas: data.map((idea) => ({
        id: idea.id,
        name: idea.name,
        score: idea.score,
      })),
    });
  } catch (error) {
    console.error("[Cron] Error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
