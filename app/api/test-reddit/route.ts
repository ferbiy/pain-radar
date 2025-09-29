import { NextRequest, NextResponse } from "next/server";
import { RedditService } from "@/services/reddit";

/**
 * Test endpoint for Reddit integration
 * GET /api/test-reddit?subreddit=startups&limit=5
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subreddit = searchParams.get("subreddit") || "startups";
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    console.log(
      `[Test Reddit] Testing Reddit integration with r/${subreddit}, limit: ${limit}`
    );

    const redditService = new RedditService();

    // Test connection first
    console.log("[Test Reddit] Testing connection...");
    const isConnected = await redditService.testConnection();

    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to connect to Reddit API",
          debug: "Check your Reddit API credentials in .env.local",
        },
        { status: 500 }
      );
    }

    // Fetch posts
    console.log(`[Test Reddit] Fetching posts from r/${subreddit}...`);
    const posts = await redditService.fetchTrendingPosts(subreddit, limit);

    // Get cache stats
    const cacheStats = redditService.getCacheStats();

    return NextResponse.json({
      success: true,
      data: {
        subreddit,
        postsCount: posts.length,
        posts: posts.map((post) => ({
          id: post.id,
          title: post.title,
          score: post.score,
          numComments: post.numComments,
          url: post.url,
          contentLength: post.content.length,
          created: post.created,
        })),
        cacheStats,
      },
      debug: {
        message: "Reddit integration test completed successfully",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Test Reddit] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        debug: {
          message: "Check the server logs for detailed error information",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Test multiple subreddits
 * POST /api/test-reddit with body: { subreddits: ["startups", "SaaS"], limit: 3 }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subreddits = ["startups", "SaaS"], limit = 3 } = body;

    console.log(`[Test Reddit] Testing multiple subreddits:`, subreddits);

    const redditService = new RedditService();

    // Test startup posts (default subreddits)
    console.log("[Test Reddit] Fetching startup posts...");
    const startupPosts = await redditService.fetchStartupPosts();

    // Test custom subreddits
    console.log("[Test Reddit] Fetching from custom subreddits...");
    const customPosts = await redditService.fetchFromMultipleSubreddits(
      subreddits,
      limit
    );

    // Get cache stats
    const cacheStats = redditService.getCacheStats();

    return NextResponse.json({
      success: true,
      data: {
        startupPosts: {
          count: startupPosts.length,
          topPost: startupPosts[0]
            ? {
                title: startupPosts[0].title,
                score: startupPosts[0].score,
                subreddit: startupPosts[0].subreddit,
              }
            : null,
        },
        customPosts: {
          subreddits,
          count: customPosts.length,
          posts: customPosts.map((post) => ({
            id: post.id,
            title: post.title,
            score: post.score,
            subreddit: post.subreddit,
            url: post.url,
          })),
        },
        cacheStats,
      },
      debug: {
        message: "Multiple subreddits test completed successfully",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Test Reddit] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        debug: {
          message: "Check the server logs for detailed error information",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
