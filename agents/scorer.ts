import { MessagesAnnotation } from "@langchain/langgraph";
import { AgentConfig } from "@/types/workflow";

/**
 * Scoring Agent - Placeholder
 * Now works with LangGraph MessagesAnnotation pattern
 * TODO: Implement in Task 5.5
 */
export async function scoringAgent(
  state: typeof MessagesAnnotation.State,
  _config: AgentConfig
): Promise<typeof MessagesAnnotation.State> {
  console.log(`[Scorer] Starting idea scoring (placeholder)`);

  // Placeholder implementation - the actual logic is in the workflow nodes
  // This function signature is kept for compatibility with the old approach
  return {
    messages: [...state.messages],
  };
}
