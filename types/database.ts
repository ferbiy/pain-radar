export interface ScoreBreakdown {
  painSeverity: number;
  marketSize: number;
  competition: number;
  feasibility: number;
  engagement: number;
  total: number;
  reasoning?: string;
}

export interface ProductIdea {
  id: string;
  name: string;
  pitch: string;
  painPoint: string;
  targetAudience: string;
  score: number;
  sources?: string[];
  category: string;
  createdAt?: Date | string; // Can be Date object or ISO string
  generatedAt?: Date | string; // Alias for createdAt from AI workflow
  isNew?: boolean;
  scoreBreakdown?: ScoreBreakdown;
  confidence?: number; // 0.0 - 1.0
}

export interface Subscription {
  id: string;
  userId: string;
  email: string;
  topics: string[];
  isActive: boolean;
  unsubscribeToken: string;
  createdAt: Date;
  lastEmailSent: Date | null;
}

export interface RedditSource {
  id: string;
  subreddit: string;
  lastChecked: Date | null;
  isActive: boolean;
  subscriberCount: number;
}

export interface EmailLog {
  id: string;
  subscriptionId: string;
  sentAt: Date;
  status: "sent" | "failed" | "pending";
  ideasSent: number;
}
