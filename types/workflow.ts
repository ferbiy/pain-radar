import { RedditPost } from "./reddit";
import { Annotation } from "@langchain/langgraph";

/**
 * Workflow State Annotation for LangGraph
 * This is the proper way to define state in LangGraph using Annotation.Root
 * Replaces the old MessagesAnnotation hack
 */
export const WorkflowStateAnnotation = Annotation.Root({
  // Workflow tracking
  workflowId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),

  threadId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),

  currentStep: Annotation<WorkflowStep>({
    reducer: (x, y) => y ?? x,
    default: () => "initializing" as WorkflowStep,
  }),

  // Data flow - these ACCUMULATE
  redditPosts: Annotation<RedditPost[]>({
    reducer: (x, y) => (y !== undefined ? y : x), // Replace, don't accumulate
    default: () => [],
  }),

  painPoints: Annotation<PainPoint[]>({
    reducer: (x, y) => (y !== undefined ? y : x), // Replace, don't accumulate
    default: () => [],
  }),

  ideas: Annotation<ProductIdeaLocal[]>({
    reducer: (x, y) => (y !== undefined ? y : x), // Replace, don't accumulate
    default: () => [],
  }),

  // Error tracking - ACCUMULATES
  errors: Annotation<string[]>({
    reducer: (x, y) => (y ? [...x, ...y] : x),
    default: () => [],
  }),

  // Metadata
  startTime: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => Date.now(),
  }),

  processingStats: Annotation<ProcessingStats | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
});

/**
 * TypeScript type derived from the annotation
 */
export type WorkflowState = typeof WorkflowStateAnnotation.State;

/**
 * Legacy interface for backward compatibility
 * @deprecated Use WorkflowState type from WorkflowStateAnnotation instead
 */
export interface WorkflowStateLegacy {
  // Basic tracking
  workflowId: string;
  currentStep: WorkflowStep;

  // Data flow
  redditPosts: RedditPost[];
  painPoints: PainPoint[];
  ideas: ProductIdeaLocal[];

  // Error tracking
  errors: string[];

  // Metadata
  startTime: Date;
  endTime?: Date;
  processingStats?: ProcessingStats;
}

export type WorkflowStep =
  | "initializing"
  | "extracting"
  | "generating"
  | "scoring"
  | "complete"
  | "error";

/**
 * Pain Point extracted from Reddit content
 */
export interface PainPoint {
  id: string;
  description: string;
  severity: "low" | "medium" | "high";
  category: string; // e.g., "hiring", "funding", "technical", "marketing"
  source: string; // Reddit post URL
  examples: string[]; // Specific quotes from posts/comments
  confidence: number; // 0-1, how confident the AI is about this pain point
  frequency: number; // How often this pain appears across posts
}

/**
 * Product Idea generated from pain points
 */
export interface ProductIdeaLocal {
  id: string;
  name: string;
  pitch: string; // 1-2 sentences elevator pitch
  painPoint: string; // The specific problem it solves
  targetAudience: string; // Who would use this
  category: string; // Business category
  sources: string[]; // Reddit URLs that inspired this idea

  // Scoring details (filled by scoring agent)
  score: number; // 0-100 total score
  scoreBreakdown?: ScoreBreakdown;

  // Metadata
  generatedAt: Date;
  confidence: number; // AI confidence in this idea
}

/**
 * Detailed scoring breakdown for product ideas
 */
export interface ScoreBreakdown {
  painSeverity: number; // 0-30 points
  marketSize: number; // 0-25 points
  competition: number; // 0-20 points (higher = less competition)
  feasibility: number; // 0-15 points
  engagement: number; // 0-10 points (based on Reddit engagement)
  total: number; // Sum of all scores
  reasoning: string; // Brief explanation of the score
}

/**
 * Processing statistics for the workflow
 */
export interface ProcessingStats {
  postsProcessed: number;
  painPointsExtracted: number;
  ideasGenerated: number;
  averageScore: number;
  processingTimeMs: number;
  tokensUsed?: number;
}

/**
 * Agent execution result
 */
export interface AgentResult<T = WorkflowData> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed?: number;
  processingTimeMs: number;
}

/**
 * Workflow data structure that flows through the LangGraph nodes
 * Now aligned with WorkflowState
 */
export interface WorkflowData {
  workflowId: string;
  threadId?: string;
  currentStep: WorkflowStep;
  redditPosts: RedditPost[];
  painPoints: PainPoint[];
  ideas: ProductIdeaLocal[];
  errors: string[];
  processingStats?: ProcessingStats;
  startTime?: number;
}

/**
 * LangGraph node return type
 */
export interface NodeResult {
  messages: Array<{
    content: string | Array<unknown>;
  }>;
}

/**
 * LangGraph message types for agent communication
 */
export interface AgentMessage {
  type: "data" | "error" | "status";
  content: unknown;
  timestamp: Date;
  agentId: string;
}

/**
 * Configuration for the AI agents
 */
export interface AgentConfig {
  model: string; // e.g., "gpt-4o-mini"
  maxTokens?: number;
  timeout?: number; // milliseconds
}

/**
 * Workflow configuration
 */
export interface WorkflowConfig {
  agents: {
    painExtractor: AgentConfig;
    ideaGenerator: AgentConfig;
    scorer: AgentConfig;
  };
  limits: {
    maxPainPoints: number;
    maxIdeasPerPainPoint: number;
    maxProcessingTime: number; // milliseconds
  };
  debug: boolean;
}
