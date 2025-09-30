import { NextRequest, NextResponse } from "next/server";
import {
  dequeueJob,
  completeJob,
  failJob,
  getJobStatus,
  enqueuePostJob,
} from "@/lib/queue/operations";
import { runSinglePostWorkflow } from "@/agents/workflow";
import { RedditService } from "@/services/reddit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/types/supabase";
import type { RedditPost } from "@/types/reddit";

/**
 * Process next job in queue
 * POST /api/queue/process
 *
 * Triggered by Vercel Cron every minute
 * Security: Requires CRON_SECRET header
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Verify cron secret
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

    console.log("[Queue Worker] Checking for jobs...");

    // Get next job from queue
    const jobId = await dequeueJob();

    if (!jobId) {
      console.log("[Queue Worker] No jobs in queue");

      return NextResponse.json({ message: "No jobs in queue" });
    }

    console.log(`[Queue Worker] Processing job ${jobId}`);

    // Get job details to determine type
    const job = await getJobStatus(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    console.log(`[Queue Worker] Job type: ${job.type}`);

    // Route to appropriate handler based on job type
    if (job.type === "coordinator") {
      // Handle coordinator job: fetch posts and spawn individual jobs
      try {
        console.log("[Queue Worker] Processing coordinator job...");

        // Fetch Reddit posts (reusing logic from cron/generate)
        const redditService = new RedditService();

        // Step 1: Query active subreddits from database
        const { data: sources, error: sourcesError } = await supabaseAdmin
          .from("reddit_sources")
          .select("subreddit")
          .eq("is_active", true)
          .order("subscriber_count", { ascending: false });

        if (sourcesError) {
          throw new Error(
            `Failed to fetch reddit sources: ${sourcesError.message}`
          );
        }

        // Remove 'r/' prefix if present
        const subreddits =
          sources?.map((s) => s.subreddit.replace(/^r\//, "")) || [];

        if (subreddits.length === 0) {
          throw new Error("No active reddit sources configured");
        }

        console.log(
          `[Queue Worker] Found ${subreddits.length} active subreddits:`,
          subreddits
        );

        // Step 2: Get already-processed post IDs
        const { data: existingIdeas } = await supabaseAdmin
          .from("ideas")
          .select("sources");

        const processedPostIds = new Set<string>();

        existingIdeas?.forEach((idea) => {
          const urls = (idea.sources as string[]) || [];

          urls.forEach((url) => {
            const match = url.match(/\/comments\/([a-z0-9]+)\//);

            if (match) {
              processedPostIds.add(match[1]);
            }
          });
        });

        console.log(
          `[Queue Worker] Already processed ${processedPostIds.size} posts (will skip these)`
        );

        // Step 3: Fetch posts sequentially with delays
        const allPosts: RedditPost[] = [];
        const limit = 5; // Fetch 5 posts per subreddit

        for (const subreddit of subreddits) {
          try {
            // Add delay between requests (1 second)
            if (allPosts.length > 0) {
              console.log(`[Queue Worker] Waiting 1s before next subreddit...`);
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            const posts = await redditService.fetchTrendingPosts(
              subreddit,
              limit
            );

            allPosts.push(...posts);
            console.log(
              `[Queue Worker] ✅ Fetched ${posts.length} posts from r/${subreddit}`
            );
          } catch (error) {
            console.error(
              `[Queue Worker] ❌ Failed to fetch from r/${subreddit}:`,
              error instanceof Error ? error.message : error
            );
          }
        }

        // Deduplicate: filter out already-processed posts
        const newPosts = allPosts.filter((post) => {
          const postId = post.url.match(/\/comments\/([a-z0-9]+)\//)?.[1];

          return postId && !processedPostIds.has(postId);
        });

        console.log(
          `[Queue Worker] Fetched ${allPosts.length} total posts, ${newPosts.length} are new`
        );

        if (newPosts.length === 0) {
          throw new Error("No new Reddit posts found (all already processed)");
        }

        // Step 4: Spawn individual post_processor jobs for each post
        console.log(
          `[Queue Worker] Spawning ${newPosts.length} post_processor jobs...`
        );

        const spawnedJobs: string[] = [];

        for (const post of newPosts) {
          const postJobId = await enqueuePostJob(post);

          spawnedJobs.push(postJobId);
        }

        console.log(
          `[Queue Worker] Successfully spawned ${spawnedJobs.length} post_processor jobs`
        );

        // Step 6: Update reddit_sources last_checked
        await supabaseAdmin
          .from("reddit_sources")
          .update({ last_checked: new Date().toISOString() })
          .in(
            "subreddit",
            subreddits.map((s) => `r/${s}`)
          );

        // Step 5: Mark coordinator job as completed
        await completeJob(jobId, {
          ideasGenerated: 0, // Coordinator doesn't generate ideas directly
          ideaIds: spawnedJobs, // Use spawned job IDs as reference
        });

        console.log(
          `[Queue Worker] ✅ Coordinator job ${jobId} completed - spawned ${spawnedJobs.length} jobs`
        );

        return NextResponse.json({
          success: true,
          jobId,
          jobType: "coordinator",
          spawnedJobs: spawnedJobs.length,
          postsFound: newPosts.length,
        });
      } catch (error) {
        // Mark coordinator job as failed
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        await failJob(jobId, errorMessage);

        console.error(
          `[Queue Worker] ❌ Coordinator job ${jobId} failed:`,
          error
        );

        return NextResponse.json(
          {
            success: false,
            jobId,
            jobType: "coordinator",
            error: errorMessage,
          },
          { status: 500 }
        );
      }
    } else if (job.type === "post_processor") {
      // Handle post_processor job: process a single post
      try {
        console.log("[Queue Worker] Processing post_processor job...");

        // Extract post data from job
        const postDataString =
          typeof job.postData === "string"
            ? job.postData
            : JSON.stringify(job.postData);
        const postData = JSON.parse(postDataString);

        // Reconstruct RedditPost object
        const post: RedditPost = {
          id: postData.id,
          title: postData.title,
          url: postData.url,
          content: postData.content,
          subreddit: postData.subreddit,
          score: postData.score,
          numComments: postData.numComments,
          created: new Date(postData.created),
          comments: postData.comments,
        };

        console.log(
          `[Queue Worker] Processing post: ${post.id} - ${post.title.substring(0, 50)}...`
        );

        // Run single post workflow with timeout protection
        const timeoutMs = 180000; // 3 minutes (5s buffer before Vercel's 60s limit)

        const workflowPromise = runSinglePostWorkflow(post);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `Workflow timeout - exceeded ${timeoutMs / 1000} seconds`
                )
              ),
            timeoutMs
          )
        );

        const result = await Promise.race([workflowPromise, timeoutPromise]);

        if (!result.success || !result.data) {
          throw new Error(`Workflow failed: ${result.error}`);
        }

        // Store idea in database
        const ideaToStore = {
          title: result.data.name,
          pitch: result.data.pitch,
          pain_point: result.data.painPoint,
          target_audience: result.data.targetAudience,
          category: result.data.category,
          score: result.data.score,
          sources: result.data.sources || [],
          score_breakdown:
            (result.data.scoreBreakdown as unknown as Json) || null,
          confidence: result.data.confidence || null,
          is_new: true,
        };

        const { data: idea, error: insertError } = await supabaseAdmin
          .from("ideas")
          .insert(ideaToStore)
          .select()
          .single();

        if (insertError) {
          throw new Error(`Failed to store idea: ${insertError.message}`);
        }

        console.log(
          `[Queue Worker] Successfully stored idea: ${idea.id} - ${idea.title}`
        );

        // Mark post_processor job as completed
        await completeJob(jobId, {
          ideasGenerated: 1,
          ideaIds: [idea.id.toString()],
        });

        console.log(
          `[Queue Worker] ✅ Post_processor job ${jobId} completed - generated idea ${idea.id}`
        );

        return NextResponse.json({
          success: true,
          jobId,
          jobType: "post_processor",
          ideaId: idea.id,
          ideaName: idea.title,
          processingTime: result.processingTimeMs,
        });
      } catch (error) {
        // Mark post_processor job as failed
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        await failJob(jobId, errorMessage);

        console.error(
          `[Queue Worker] ❌ Post_processor job ${jobId} failed:`,
          error
        );

        return NextResponse.json(
          {
            success: false,
            jobId,
            jobType: "post_processor",
            error: errorMessage,
          },
          { status: 500 }
        );
      }
    } else {
      // Unknown job type
      const errorMessage = `Unknown job type: ${job.type}`;

      await failJob(jobId, errorMessage);

      return NextResponse.json(
        {
          success: false,
          jobId,
          error: errorMessage,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[Queue Worker] Critical error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
