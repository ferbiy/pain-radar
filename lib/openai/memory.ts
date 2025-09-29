import { MemorySaver } from "@langchain/langgraph";
// For production: import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

/**
 * Development: In-memory checkpointing
 *
 * Uses MemorySaver which stores workflow state in RAM.
 *
 * Pros:
 * - Fast and simple
 * - No database setup needed
 * - Perfect for development and testing
 *
 * Cons:
 * - State is lost on server restart
 * - Can't resume workflows after crashes
 * - Not suitable for production
 */
export function createDevCheckpointer() {
  console.log("[Memory] Creating in-memory checkpointer (development mode)");

  return new MemorySaver();
}

/**
 * Production: Postgres-backed checkpointing
 *
 * ⚠️ TODO: Implement this for production-ready products
 *
 * Why you need this for production:
 * 1. Workflow Recovery: Resume workflows after server crashes or deployments
 * 2. State Persistence: Maintain workflow history across restarts
 * 3. Audit Trail: Track all workflow executions and their states
 * 4. Debugging: Inspect workflow state at any checkpoint
 *
 * How to implement:
 * 1. Install: npm install @langchain/langgraph-checkpoint-postgres
 * 2. Create a checkpoints table in your database
 * 3. Initialize PostgresSaver with your database connection
 *
 * @throws Error - Not yet implemented (use dev mode for POC)
 *
 * @example
 * ```typescript
 * import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
 * import { Pool } from "pg";
 *
 * const pool = new Pool({
 *   connectionString: process.env.DATABASE_URL,
 * });
 *
 * return PostgresSaver.fromConnString(process.env.DATABASE_URL);
 * ```
 */
export async function createProdCheckpointer() {
  throw new Error(
    "Production checkpointing not implemented yet. Use 'dev' mode for now."
  );
}

/**
 * Factory function that picks the right checkpointer based on environment
 *
 * Usage:
 * - Development/POC: Use 'dev' (default) - state stored in memory
 * - Production: Use 'prod' - state stored in database (TODO: implement)
 *
 * For production-ready applications, implement createProdCheckpointer() above
 * to enable workflow recovery and persistence.
 *
 * @param env - Environment type: 'dev' for in-memory, 'prod' for persistent
 * @returns Checkpointer instance for LangGraph workflow
 */
export function createCheckpointer(env: "dev" | "prod" = "dev") {
  if (env === "prod") {
    throw new Error(
      "Production checkpointing not yet implemented. Use 'dev' mode for now."
    );
  }

  return createDevCheckpointer();
}

/**
 * Type export for checkpointer
 */
export type Checkpointer = ReturnType<typeof createDevCheckpointer>;
