import { Redis } from "@upstash/redis";

// Singleton Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Queue keys
export const QUEUE_KEYS = {
  queue: "ideas:queue", // List of pending job IDs
  processing: "ideas:processing", // Currently processing job ID
  jobPrefix: "job:", // job:{id} = job metadata
} as const;

// Job status enum
export type JobStatus = "pending" | "processing" | "completed" | "failed";

// Job type enum
export type JobType = "coordinator" | "post_processor";

// Job data structure
export interface QueueJob {
  id: string;
  type: JobType;
  userId?: string;
  status: JobStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: {
    ideasGenerated?: number;
    ideaIds?: string[];
    spawnedJobs?: string[]; // For coordinator jobs
    postsFound?: number; // For coordinator jobs
    ideaId?: string; // For post_processor jobs
  };
  error?: string;
  // Post data for post_processor jobs
  postData?: {
    id: string;
    title: string;
    url: string;
    content: string;
    subreddit: string;
    score: number;
    numComments: number;
    created: string;
    comments?: Array<{
      id: string;
      author: string;
      body: string;
      score: number;
    }>;
  };
}
