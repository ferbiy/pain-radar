import { RedditAPIClient } from "@/lib/reddit/client";
import type { RedditPost, RedditComment } from "@/types/reddit";

/**
 * Reddit Service - High-level wrapper around Reddit API Client
 * Provides business logic and caching for Reddit data operations
 */
export class RedditService {
  private client: RedditAPIClient;

  private cache: Map<
    string,
    { data: RedditPost[] | RedditComment[]; expiry: number }
  > = new Map();

  private readonly CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

  constructor() {
    this.client = new RedditAPIClient();
  }

  /**
   * Get cached data if available and not expired
   */
  private getCachedData<T extends RedditPost[] | RedditComment[]>(
    key: string
  ): T | null {
    const cached = this.cache.get(key);

    if (cached && Date.now() < cached.expiry) {
      console.log(`[Reddit Service] Cache hit for key: ${key}`);
      console.debug(`[Reddit Service] Cached data type:`, typeof cached.data);

      return cached.data as T;
    }

    if (cached) {
      this.cache.delete(key); // Remove expired cache
      console.debug(`[Reddit Service] Removed expired cache for key: ${key}`);
    }

    return null;
  }

  /**
   * Store data in cache with expiration
   */
  private setCachedData<T extends RedditPost[] | RedditComment[]>(
    key: string,
    data: T
  ): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_DURATION,
    });
    console.log(`[Reddit Service] Cached data for key: ${key}`);
    console.debug(`[Reddit Service] Caching data type:`, typeof data);
  }

  /**
   * Fetch trending posts from a specific subreddit with caching
   */
  async fetchTrendingPosts(
    subreddit: string,
    limit = 25,
    sort: "hot" | "new" | "top" = "hot"
  ): Promise<RedditPost[]> {
    const cacheKey = `posts_${subreddit}_${sort}_${limit}`;

    // Check cache first
    const cached = this.getCachedData<RedditPost[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      console.log(`[Reddit Service] Fetching fresh data from r/${subreddit}`);
      const posts = await this.client.fetchSubredditPosts(
        subreddit,
        limit,
        sort
      );

      // Filter out posts with minimal content
      const filteredPosts = posts.filter(
        (post) =>
          post.title.length > 10 && // Meaningful titles
          (post.content.length > 50 || post.numComments > 5) // Either has content or engagement
      );

      // Cache the results
      this.setCachedData(cacheKey, filteredPosts);

      return filteredPosts;
    } catch (error) {
      console.error(
        `[Reddit Service] Failed to fetch posts from r/${subreddit}:`,
        error
      );

      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Fetch comments for a specific post with caching
   */
  async fetchPostComments(
    postId: string,
    limit = 50
  ): Promise<RedditComment[]> {
    const cacheKey = `comments_${postId}_${limit}`;

    // Check cache first
    const cached = this.getCachedData<RedditComment[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      console.log(`[Reddit Service] Fetching comments for post ${postId}`);
      const comments = await this.client.fetchPostComments(postId, limit);

      // Cache the results
      this.setCachedData(cacheKey, comments);

      return comments;
    } catch (error) {
      console.error(
        `[Reddit Service] Failed to fetch comments for post ${postId}:`,
        error
      );

      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Fetch posts from multiple subreddits with intelligent caching
   */
  async fetchFromMultipleSubreddits(
    subreddits: string[],
    postsPerSubreddit = 25
  ): Promise<RedditPost[]> {
    const cacheKey = `multi_${subreddits.sort().join("_")}_${postsPerSubreddit}`;

    // Check cache first
    const cached = this.getCachedData<RedditPost[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      console.log(
        `[Reddit Service] Fetching from ${subreddits.length} subreddits`
      );

      // Add delay between requests to respect rate limits
      const posts: RedditPost[] = [];

      for (const subreddit of subreddits) {
        try {
          const subredditPosts = await this.fetchTrendingPosts(
            subreddit,
            postsPerSubreddit
          );

          posts.push(...subredditPosts);

          // Add small delay between subreddit requests
          if (subreddits.indexOf(subreddit) < subreddits.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
          }
        } catch (error) {
          console.warn(
            `[Reddit Service] Skipping r/${subreddit} due to error:`,
            error
          );
          continue;
        }
      }

      // Sort by score and remove duplicates
      const uniquePosts = posts
        .filter(
          (post, index, self) =>
            self.findIndex((p) => p.id === post.id) === index
        )
        .sort((a, b) => b.score - a.score);

      // Cache the results
      this.setCachedData(cacheKey, uniquePosts);

      console.log(
        `[Reddit Service] Successfully fetched ${uniquePosts.length} unique posts`
      );

      return uniquePosts;
    } catch (error) {
      console.error(
        `[Reddit Service] Failed to fetch from multiple subreddits:`,
        error
      );

      return [];
    }
  }

  /**
   * Get posts from default startup/business subreddits
   */
  async fetchStartupPosts(): Promise<RedditPost[]> {
    const defaultSubreddits = [
      "startups",
      "SaaS",
      "Entrepreneur",
      "smallbusiness",
      "webdev",
    ];

    return this.fetchFromMultipleSubreddits(defaultSubreddits);
  }

  /**
   * Test the Reddit service connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const isConnected = await this.client.testConnection();

      console.log(
        `[Reddit Service] Connection test: ${isConnected ? "PASSED" : "FAILED"}`
      );

      return isConnected;
    } catch (error) {
      console.error("[Reddit Service] Connection test failed:", error);

      return false;
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
    console.log("[Reddit Service] Cache cleared");
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Fetch posts with enhanced content (posts + top comments)
   * Useful for AI processing as it provides more context
   */
  async fetchEnhancedPosts(
    subreddit: string,
    limit = 10
  ): Promise<Array<RedditPost & { topComments: RedditComment[] }>> {
    const posts = await this.fetchTrendingPosts(subreddit, limit);

    const enhancedPosts = await Promise.all(
      posts.map(async (post) => {
        try {
          const comments = await this.fetchPostComments(post.id, 10);

          return {
            ...post,
            topComments: comments.slice(0, 5), // Top 5 comments
          };
        } catch (error) {
          console.warn(`Failed to fetch comments for post ${post.id}:`, error);

          return {
            ...post,
            topComments: [],
          };
        }
      })
    );

    return enhancedPosts;
  }
}
