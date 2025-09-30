import { redis, QUEUE_KEYS, QueueJob, JobType } from "./redis";
import { nanoid } from "nanoid";
import type { RedditPost } from "@/types/reddit";

/**
 * @deprecated Use enqueueCoordinatorJob() instead
 * Enqueue a new job (defaults to coordinator job for backwards compatibility)
 */
export async function enqueueJob(userId?: string): Promise<string> {
  return enqueueCoordinatorJob(userId);
}

/**
 * Enqueue a coordinator job (fetches posts and spawns post_processor jobs)
 */
export async function enqueueCoordinatorJob(userId?: string): Promise<string> {
  const jobId = nanoid(12);

  // Build job object, only include userId if it exists (Redis doesn't accept null)
  const job: Record<string, string | number> = {
    id: jobId,
    type: "coordinator",
    status: "pending",
    createdAt: Date.now(),
  };

  if (userId) {
    job.userId = userId;
  }

  // Store job metadata
  await redis.hset(`${QUEUE_KEYS.jobPrefix}${jobId}`, job);

  // Add to queue (LPUSH = add to front, RPOP = remove from back = FIFO)
  await redis.lpush(QUEUE_KEYS.queue, jobId);

  console.log(
    `[Queue] Enqueued coordinator job ${jobId}${
      userId ? ` for user ${userId}` : ""
    }`
  );

  return jobId;
}

/**
 * Enqueue a post processor job (processes a single Reddit post)
 */
export async function enqueuePostJob(
  post: RedditPost,
  userId?: string
): Promise<string> {
  const jobId = nanoid(12);

  // Serialize post data for Redis storage
  const postData = {
    id: post.id,
    title: post.title,
    url: post.url,
    content: post.content,
    subreddit: post.subreddit,
    score: post.score,
    numComments: post.numComments,
    created: post.created.toISOString(),
    comments: post.comments?.map((c) => ({
      id: c.id,
      author: c.author,
      body: c.body,
      score: c.score,
    })),
  };

  // Build job object
  const job: Record<string, unknown> = {
    id: jobId,
    type: "post_processor",
    status: "pending",
    createdAt: Date.now(),
    postData: JSON.stringify(postData), // Serialize for Redis
  };

  if (userId) {
    job.userId = userId;
  }

  // Store job metadata
  await redis.hset(`${QUEUE_KEYS.jobPrefix}${jobId}`, job);

  // Add to queue
  await redis.lpush(QUEUE_KEYS.queue, jobId);

  console.log(
    `[Queue] Enqueued post_processor job ${jobId} for post ${post.id}`
  );

  return jobId;
}

/**
 * Get next job from queue (returns null if empty)
 */
export async function dequeueJob(): Promise<string | null> {
  const TIMEOUT = 10 * 60 * 1000; // 10 minutes

  // Check if already processing
  const processing = await redis.get(QUEUE_KEYS.processing);

  if (processing) {
    // Check if job has been processing too long
    const job = await getJobStatus(processing as string);

    if (job && job.startedAt) {
      const processingTime = Date.now() - job.startedAt;

      if (processingTime > TIMEOUT) {
        console.warn(
          `[Queue] Job ${processing} timed out after ${Math.round(
            processingTime / 1000
          )}s, marking as failed`
        );
        await failJob(
          processing as string,
          "Processing timeout exceeded 10 minutes"
        );
        // Continue to dequeue next job
      } else {
        console.log(
          `[Queue] Job ${processing} still processing (${Math.round(
            processingTime / 1000
          )}s elapsed)`
        );

        return null;
      }
    } else {
      // Job metadata missing or invalid, clear the flag and continue
      console.warn(
        `[Queue] Processing flag set but job ${processing} not found, clearing flag`
      );
      await redis.del(QUEUE_KEYS.processing);
    }
  }

  // Get next job WITHOUT removing it yet (safer order of operations)
  const jobId = await redis.lindex(QUEUE_KEYS.queue, -1);

  if (!jobId) {
    return null;
  }

  // Mark as processing FIRST
  await redis.set(QUEUE_KEYS.processing, jobId);

  // Update job status
  await redis.hset(`${QUEUE_KEYS.jobPrefix}${jobId}`, {
    status: "processing",
    startedAt: Date.now(),
  });

  // NOW remove from queue (safe because already marked as processing)
  await redis.rpop<string>(QUEUE_KEYS.queue);

  console.log(`[Queue] Dequeued job ${jobId}`);

  return jobId;
}

/**
 * Complete a job (success)
 */
export async function completeJob(
  jobId: string,
  result: { ideasGenerated: number; ideaIds: string[] }
): Promise<void> {
  await redis.hset(`${QUEUE_KEYS.jobPrefix}${jobId}`, {
    status: "completed",
    completedAt: Date.now(),
    result,
  });

  // Set TTL: auto-delete after 24 hours to prevent memory leak
  await redis.expire(`${QUEUE_KEYS.jobPrefix}${jobId}`, 86400);

  // Clear processing flag
  await redis.del(QUEUE_KEYS.processing);

  console.log(`[Queue] Completed job ${jobId} (will auto-delete in 24h)`);
}

/**
 * Fail a job (error)
 */
export async function failJob(jobId: string, error: string): Promise<void> {
  await redis.hset(`${QUEUE_KEYS.jobPrefix}${jobId}`, {
    status: "failed",
    completedAt: Date.now(),
    error,
  });

  // Set TTL: auto-delete after 24 hours to prevent memory leak
  await redis.expire(`${QUEUE_KEYS.jobPrefix}${jobId}`, 86400);

  // Clear processing flag
  await redis.del(QUEUE_KEYS.processing);

  console.error(
    `[Queue] Failed job ${jobId}: ${error} (will auto-delete in 24h)`
  );
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<QueueJob | null> {
  const job = await redis.hgetall<Record<string, unknown>>(
    `${QUEUE_KEYS.jobPrefix}${jobId}`
  );

  if (!job || Object.keys(job).length === 0) {
    return null;
  }

  return job as unknown as QueueJob;
}

/**
 * Get queue position (1 = next, 2 = second, etc.)
 */
export async function getQueuePosition(jobId: string): Promise<number | null> {
  const queue = await redis.lrange<string>(QUEUE_KEYS.queue, 0, -1);
  const position = queue.findIndex((id) => id === jobId);

  if (position === -1) {
    return null; // Not in queue (maybe processing or completed)
  }

  // +1 if there's a job currently processing
  const processing = await redis.get(QUEUE_KEYS.processing);

  return position + (processing ? 1 : 0) + 1; // +1 for 1-indexed
}
