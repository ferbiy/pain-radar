import { RedditPost } from "./reddit";
import { ProductIdea } from "./database";

export interface WorkflowState {
  workflowId: string;
  currentStep:
    | "fetching"
    | "extracting"
    | "generating"
    | "scoring"
    | "complete";
  redditPosts: RedditPost[];
  painPoints: PainPoint[];
  ideas: ProductIdea[];
  errors: string[];
}

export interface PainPoint {
  description: string;
  severity: "low" | "medium" | "high";
  source: string;
  examples: string[];
}
