import { nanoid } from "nanoid";

/**
 * Generate unique thread ID for workflow execution
 * Each workflow run should have its own thread to prevent state collision
 *
 * @returns Unique thread ID with 'thread_' prefix
 */
export function createThreadId(): string {
  return `thread_${nanoid(12)}`;
}

/**
 * Thread configuration for LangGraph invocation
 * Required for checkpointing and state management
 */
export interface ThreadConfig {
  configurable: {
    thread_id: string;
  };
}

/**
 * Create thread config for workflow invocation
 * Use this when starting a new workflow
 *
 * @param threadId - Optional specific thread ID, generates new one if not provided
 * @returns Thread configuration object for LangGraph
 */
export function createThreadConfig(threadId?: string): ThreadConfig {
  const id = threadId ?? createThreadId();

  console.log(`[Threading] Creating thread config: ${id}`);

  return {
    configurable: {
      thread_id: id,
    },
  };
}

/**
 * Resume workflow from checkpoint using existing thread ID
 * Use this when continuing a previously started workflow
 *
 * @param threadId - Existing thread ID from checkpoint
 * @returns Thread configuration object for LangGraph
 */
export function resumeThreadConfig(threadId: string): ThreadConfig {
  console.log(`[Threading] Resuming thread: ${threadId}`);

  return {
    configurable: {
      thread_id: threadId,
    },
  };
}

/**
 * Extract thread ID from thread config
 *
 * @param config - Thread configuration object
 * @returns Thread ID string
 */
export function getThreadId(config: ThreadConfig): string {
  return config.configurable.thread_id;
}
