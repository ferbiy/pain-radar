import { MessagesAnnotation } from "@langchain/langgraph";
import { AgentConfig } from "@/types/workflow";

/**
 * Idea Generator Agent - Placeholder
 * Now works with LangGraph MessagesAnnotation pattern
 * TODO: Implement in Task 5.4
 */
export async function ideaGeneratorAgent(
  state: typeof MessagesAnnotation.State,
  _config: AgentConfig
): Promise<typeof MessagesAnnotation.State> {
  console.log(`[Idea Generator] Starting idea generation (placeholder)`);

  // Placeholder implementation - the actual logic is in the workflow nodes
  // This function signature is kept for compatibility with the old approach
  return {
    messages: [...state.messages],
  };
}
