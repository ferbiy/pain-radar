export interface ProductIdea {
  id: string;
  name: string;
  pitch: string;
  painPoint: string;
  targetAudience: string;
  score: number;
  sources: string[];
  category: string;
  createdAt: Date;
  isNew: boolean;
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
