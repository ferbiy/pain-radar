import axios from "axios";
import { RedditPost, RedditComment } from "@/types/reddit";
import {
  RedditAuthResponse,
  RedditListingResponse,
  RedditCommentsResponse,
} from "@/types/reddit-api";

/**
 * Rate limit information from Reddit API
 */
interface RateLimitInfo {
  used: number;
  remaining: number;
  reset: number; // Timestamp when rate limit resets
}

/**
 * Reddit API Client for backend data fetching
 * This client is used by our backend service to fetch Reddit data
 * It does NOT handle user authentication (that's done via Supabase)
 *
 * Rate Limiting:
 * - OAuth clients: 100 requests per minute
 * - Rate limits are averaged over a 10-minute window
 * - This client tracks and respects X-Ratelimit-* headers
 */
export class RedditAPIClient {
  private client: ReturnType<typeof axios.create>;

  private accessToken: string | null = null;

  private tokenExpiry: number = 0;

  // Rate limit tracking
  private rateLimitInfo: RateLimitInfo = {
    used: 0,
    remaining: 100,
    reset: 0,
  };

  constructor() {
    this.client = axios.create({
      baseURL: "https://oauth.reddit.com",
      headers: {
        "User-Agent": process.env.REDDIT_USER_AGENT!,
      },
      timeout: 10000, // 10 second timeout
    });

    // Add response interceptor for rate limit tracking and error handling
    this.client.interceptors.response.use(
      (response) => {
        // Capture rate limit headers from successful responses
        this.updateRateLimitInfo(response.headers);

        return response;
      },
      (error) => {
        const errorObj = error as {
          response?: {
            data?: unknown;
            headers?: Record<string, string>;
            status?: number;
          };
          message?: string;
        };

        // Capture rate limit headers even from error responses
        if (errorObj.response?.headers) {
          this.updateRateLimitInfo(errorObj.response.headers);
        }

        // Log rate limit errors with more detail
        if (errorObj.response?.status === 429) {
          console.error(
            `[Reddit API] Rate limit exceeded! Reset in ${this.getSecondsUntilReset()}s`
          );
          console.error("[Reddit API] Rate limit info:", this.rateLimitInfo);
        }

        console.error(
          "Reddit API Error:",
          errorObj?.response?.data || errorObj?.message
        );
        console.debug("[Reddit API] Full error object:", error);

        return Promise.reject(error);
      }
    );
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimitInfo(headers: Record<string, string>): void {
    const used = headers["x-ratelimit-used"];
    const remaining = headers["x-ratelimit-remaining"];
    const reset = headers["x-ratelimit-reset"];

    if (used !== undefined) {
      this.rateLimitInfo.used = parseFloat(used);
    }

    if (remaining !== undefined) {
      this.rateLimitInfo.remaining = parseFloat(remaining);
    }

    if (reset !== undefined) {
      const resetSeconds = parseFloat(reset);

      this.rateLimitInfo.reset = Date.now() + resetSeconds * 1000;
    }

    console.debug("[Reddit API] Rate limit updated:", {
      used: this.rateLimitInfo.used,
      remaining: this.rateLimitInfo.remaining,
      resetIn: `${this.getSecondsUntilReset()}s`,
    });
  }

  /**
   * Get seconds until rate limit resets
   */
  private getSecondsUntilReset(): number {
    if (this.rateLimitInfo.reset === 0) return 0;

    const secondsUntilReset = Math.max(
      0,
      Math.ceil((this.rateLimitInfo.reset - Date.now()) / 1000)
    );

    return secondsUntilReset;
  }

  /**
   * Check if we should wait before making the next request
   * Returns the number of milliseconds to wait (0 if can proceed immediately)
   */
  async checkRateLimit(): Promise<number> {
    // If we have very few requests remaining, wait for reset
    if (this.rateLimitInfo.remaining < 5 && this.rateLimitInfo.reset > 0) {
      const waitTime = (this.getSecondsUntilReset() + 1) * 1000; // +1 second buffer

      console.warn(
        `[Reddit API] Only ${this.rateLimitInfo.remaining} requests remaining. Waiting ${waitTime}ms for rate limit reset`
      );

      return waitTime;
    }

    return 0;
  }

  /**
   * Wait for rate limit to reset if necessary
   */
  async waitForRateLimit(): Promise<void> {
    const waitTime = await this.checkRateLimit();

    if (waitTime > 0) {
      console.log(`[Reddit API] Waiting ${waitTime}ms for rate limit...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      console.log("[Reddit API] Rate limit wait complete");
    }
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): RateLimitInfo {
    return { ...this.rateLimitInfo };
  }

  /**
   * Authenticate with Reddit API using client credentials
   * This is for backend access only, not user authentication
   */
  private async authenticate(): Promise<void> {
    const auth = Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
    ).toString("base64");

    try {
      const { data } = await axios.post<RedditAuthResponse>(
        "https://www.reddit.com/api/v1/access_token",
        new URLSearchParams({
          grant_type: "password",
          username: process.env.REDDIT_USERNAME!, // Bot account
          password: process.env.REDDIT_PASSWORD!, // Bot account
        }),
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "User-Agent": process.env.REDDIT_USER_AGENT!,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      console.debug("[Reddit API] Auth response received:", {
        token_type: data.token_type,
        expires_in: data.expires_in,
        scope: data.scope,
        // access_token: "[REDACTED]" - never log tokens
      });

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000; // 1 min buffer
      this.client.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${data.access_token}`;

      console.log("[Reddit API] Successfully authenticated");
    } catch (error) {
      console.error("[Reddit API] Authentication failed:", error);
      throw new Error("Failed to authenticate with Reddit API");
    }
  }

  /**
   * Ensure we have a valid access token before making requests
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  /**
   * Fetch posts from a specific subreddit
   */
  async fetchSubredditPosts(
    subreddit: string,
    limit = 25,
    sort: "hot" | "new" | "top" = "hot"
  ): Promise<RedditPost[]> {
    await this.ensureAuthenticated();
    await this.waitForRateLimit(); // Wait if rate limit is low

    try {
      const { data } = await this.client.get<RedditListingResponse>(
        `/r/${subreddit}/${sort}`,
        {
          params: { limit },
        }
      );

      console.debug(
        `[Reddit API] Raw subreddit data for r/${subreddit}:`,
        data
      );

      console.debug(`[Reddit API] Children array:`, data.data?.children);

      const posts = data.data.children.map((post) => {
        console.debug("[Reddit API] Individual post data:", post.data);

        const postData = post.data;

        return {
          id: postData.id,
          subreddit: postData.subreddit,
          title: postData.title,
          content: postData.selftext || "", // Some posts don't have selftext
          url: `https://reddit.com${postData.permalink}`,
          score: postData.score,
          numComments: postData.num_comments,
          created: new Date(postData.created_utc * 1000),
        };
      });

      console.log(
        `[Reddit API] Fetched ${posts.length} posts from r/${subreddit}`
      );

      return posts;
    } catch (error) {
      console.error(`Failed to fetch posts from r/${subreddit}:`, error);
      throw new Error(
        `Reddit API error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Fetch comments from a specific post
   */
  async fetchPostComments(
    postId: string,
    limit = 50
  ): Promise<RedditComment[]> {
    await this.ensureAuthenticated();

    try {
      const { data } = await this.client.get<RedditCommentsResponse>(
        `/comments/${postId}`,
        {
          params: { limit, depth: 1 },
        }
      );

      console.debug(`[Reddit API] Raw comments data for post ${postId}:`, data);

      const commentsListing = data[1];
      const comments = commentsListing?.data?.children || [];

      console.debug(
        `[Reddit API] Comments structure:`,
        commentsListing?.data?.children
      );

      const filteredComments = comments
        .filter((comment) => {
          console.debug("[Reddit API] Individual comment data:", comment.data);
          const commentData = comment.data;

          return (
            commentData.score > 5 && // High-quality comments
            commentData.body &&
            commentData.body !== "[deleted]" &&
            commentData.body !== "[removed]"
          );
        })
        .map((comment) => {
          const commentData = comment.data;

          return {
            id: commentData.id,
            body: commentData.body,
            score: commentData.score,
            author: commentData.author,
          };
        });

      console.log(
        `[Reddit API] Fetched ${filteredComments.length} comments for post ${postId}`
      );

      return filteredComments;
    } catch (error) {
      console.error(`Failed to fetch comments for post ${postId}:`, error);
      throw new Error(
        `Reddit API error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Fetch posts from multiple subreddits
   */
  async fetchMultipleSubreddits(subreddits: string[]): Promise<RedditPost[]> {
    console.log(
      `[Reddit API] Fetching posts from ${subreddits.length} subreddits`
    );

    const allPosts = await Promise.allSettled(
      subreddits.map((subreddit) => this.fetchSubredditPosts(subreddit))
    );

    const successfulResults = allPosts
      .filter(
        (result): result is PromiseFulfilledResult<RedditPost[]> =>
          result.status === "fulfilled"
      )
      .flatMap((result) => result.value)
      .sort((a, b) => b.score - a.score); // Sort by score descending

    // Log failed subreddits
    const failedResults = allPosts.filter(
      (result) => result.status === "rejected"
    );

    if (failedResults.length > 0) {
      console.warn(
        `[Reddit API] Failed to fetch from ${failedResults.length} subreddits`
      );
    }

    console.log(
      `[Reddit API] Successfully fetched ${successfulResults.length} total posts`
    );

    return successfulResults;
  }

  /**
   * Test the connection to Reddit API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.ensureAuthenticated();
      // Try to fetch a small amount of data from a popular subreddit
      await this.fetchSubredditPosts("popular", 1);

      return true;
    } catch (error) {
      console.error("[Reddit API] Connection test failed:", error);

      return false;
    }
  }
}
