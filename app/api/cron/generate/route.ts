import { NextRequest, NextResponse } from "next/server";
import { runIdeaGenerationWorkflow } from "@/agents/workflow";
import { RedditService } from "@/services/reddit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/types/supabase";
import type { RedditPost } from "@/types/reddit";

/**
 * Cron endpoint to generate product ideas
 * POST /api/cron/generate
 *
 * Security: Requires CRON_SECRET header
 *
 * Strategy:
 * 1. Query active subreddits from reddit_sources table
 * 2. Get already-processed post IDs from existing ideas
 * 3. Fetch posts with fallback & deduplication
 * 4. Run AI workflow
 * 5. Store results and update last_checked timestamp
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

    // Step 1: Query active subreddits from database
    const { data: sources, error: sourcesError } = await supabaseAdmin
      .from("reddit_sources")
      .select("subreddit")
      .eq("is_active", true)
      .order("subscriber_count", { ascending: false });

    if (sourcesError) {
      console.error("[Cron] Error fetching reddit sources:", sourcesError);

      return NextResponse.json(
        {
          error: "Failed to fetch reddit sources",
          details: sourcesError.message,
        },
        { status: 500 }
      );
    }

    // Remove 'r/' prefix if present (database stores 'r/startups', but RedditService expects 'startups')
    const subreddits =
      sources?.map((s) => s.subreddit.replace(/^r\//, "")) || [];

    if (subreddits.length === 0) {
      return NextResponse.json(
        { error: "No active reddit sources configured" },
        { status: 400 }
      );
    }

    console.log(
      `[Cron] Found ${subreddits.length} active subreddits:`,
      subreddits
    );

    // Step 2: Get already-processed post IDs from existing ideas
    const { data: existingIdeas } = await supabaseAdmin
      .from("ideas")
      .select("sources");

    const processedPostIds = new Set<string>();

    existingIdeas?.forEach((idea) => {
      const urls = (idea.sources as string[]) || [];

      urls.forEach((url) => {
        // Extract Reddit post ID from URL: https://reddit.com/r/startups/comments/abc123/title/
        const match = url.match(/\/comments\/([a-z0-9]+)\//);

        if (match) {
          processedPostIds.add(match[1]);
        }
      });
    });

    console.log(
      `[Cron] Already processed ${processedPostIds.size} posts (will skip these)`
    );

    // Step 3: Fetch posts with fallback & deduplication
    // Use sequential fetching with exponential backoff to respect rate limits
    const redditService = new RedditService();
    let allPosts: RedditPost[] = [];
    let limit = 3; // Start with 3 posts per subreddit
    let retryAttempt = 0;
    const maxRetries = 5;

    while (allPosts.length === 0 && retryAttempt < maxRetries) {
      console.log(
        `[Cron] Attempt ${retryAttempt + 1}/${maxRetries}: Fetching up to ${limit} posts per subreddit...`
      );

      const rawPosts: RedditPost[] = [];
      let successCount = 0;
      let failCount = 0;

      // Fetch subreddits SEQUENTIALLY (not in parallel) with delays
      for (const subreddit of subreddits) {
        try {
          // Add delay between requests (exponential backoff)
          const delayMs = Math.min(1000 * Math.pow(1.5, retryAttempt), 30000); // 1s → 1.5s → 2.25s → ...

          if (successCount > 0 || failCount > 0) {
            console.log(`[Cron] Waiting ${delayMs}ms before next subreddit...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }

          const posts = await redditService.fetchTrendingPosts(
            subreddit,
            limit
          );

          rawPosts.push(...posts);
          successCount++;
          console.log(
            `[Cron] ✅ Fetched ${posts.length} posts from r/${subreddit}`
          );
        } catch (error) {
          failCount++;
          console.error(
            `[Cron] ❌ Failed to fetch from r/${subreddit}:`,
            error instanceof Error ? error.message : error
          );

          // If it's a rate limit error, wait longer before continuing
          if (error instanceof Error && error.message.includes("429")) {
            const waitTime = 60000; // Wait 60 seconds for rate limit

            console.warn(
              `[Cron] Rate limit hit! Waiting ${waitTime / 1000}s before continuing...`
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }
        }
      }

      console.log(
        `[Cron] Fetch complete: ${successCount} succeeded, ${failCount} failed (${rawPosts.length} total posts)`
      );

      // Deduplicate: filter out already-processed posts
      allPosts = rawPosts.filter((post) => {
        const postId = post.url.match(/\/comments\/([a-z0-9]+)\//)?.[1];

        return postId && !processedPostIds.has(postId);
      });

      console.log(`[Cron] After deduplication: ${allPosts.length} new posts`);

      if (allPosts.length === 0) {
        retryAttempt++;

        if (retryAttempt < maxRetries) {
          limit = Math.min(limit + 2, 10); // Increase limit gradually: 3 → 5 → 7 → 9 → 10
          const waitTime = 5000 * retryAttempt; // 5s → 10s → 15s → 20s

          console.log(
            `[Cron] No new posts found. Waiting ${waitTime / 1000}s before retry ${retryAttempt + 1} with limit ${limit}...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    if (allPosts.length === 0) {
      return NextResponse.json(
        { error: "No new Reddit posts found (all posts already processed)" },
        { status: 400 }
      );
    }

    console.log(
      `[Cron] Processing ${allPosts.length} new posts through AI workflow`
    );

    // Step 4: Run AI workflow
    const result = await runIdeaGenerationWorkflow(allPosts, { env: "dev" });

    if (!result.success || !result.data?.ideas) {
      return NextResponse.json(
        { error: "Workflow failed", details: result.data?.errors },
        { status: 500 }
      );
    }

    // Store ideas in Supabase
    const ideasToStore = result.data.ideas.map((idea) => ({
      title: idea.name,
      pitch: idea.pitch,
      pain_point: idea.painPoint,
      target_audience: idea.targetAudience,
      category: idea.category,
      score: idea.score,
      sources: idea.sources || [],
      score_breakdown: (idea.scoreBreakdown as unknown as Json) || null,
      confidence: idea.confidence || null,
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

    // Step 5: Update last_checked timestamp for processed subreddits
    const { error: updateError } = await supabaseAdmin
      .from("reddit_sources")
      .update({ last_checked: new Date().toISOString() })
      .in("subreddit", subreddits);

    if (updateError) {
      console.warn(
        "[Cron] Failed to update last_checked timestamp:",
        updateError
      );
      // Don't fail the request, just log the warning
    } else {
      console.log(
        `[Cron] Updated last_checked for ${subreddits.length} subreddits`
      );
    }

    return NextResponse.json({
      success: true,
      ideasGenerated: data.length,
      processingTime: result.processingTimeMs,
      subredditsProcessed: subreddits.length,
      postsProcessed: allPosts.length,
      ideas: data.map((idea) => ({
        id: idea.id,
        name: idea.title,
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
