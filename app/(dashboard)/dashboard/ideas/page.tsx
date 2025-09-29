"use client";

import { IdeasFeed } from "@/components/ideas/ideas-feed";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

// Mock data for now - will be replaced with real data from API
const mockIdeas = [
  {
    id: "1",
    name: "Launch Loom",
    pitch:
      "Launch Loom helps early-stage founders get consistent, high-reach traction by automating and optimizing community launches: it schedules targeted posts across relevant subreddits and forums, auto-formats a tested launch template, and collects structured feedback into actionable metrics and signup funnels.",
    painPoint:
      "Early-stage founders rely on recurring subreddit 'Share Your Startup' threads to promote their startups, collect feedback, and find users/investors because they lack affordable, high-reach channels for early traction and validation.",
    targetAudience:
      "Pre-seed to Seed founders (solo or small founding teams) who regularly use Reddit/online communities to promote early launches and need low-cost traction and validation",
    category: "Marketing",
    sources: [
      "https://reddit.com/r/startups/comments/1lxc97s/share_your_startup_quarterly_post/",
    ],
    score: 91,
    scoreBreakdown: {
      painSeverity: 30,
      marketSize: 21,
      competition: 18,
      feasibility: 12,
      engagement: 10,
      total: 91,
      reasoning:
        "High pain severity with strong market potential. Relatively low direct competition but strong differentiation needed.",
    },
    generatedAt: new Date().toISOString(),
    confidence: 0.8,
  },
  {
    id: "2",
    name: "Design Match",
    pitch:
      "Design Match helps small SaaS startups hire quality product designers fast by combining a curated, vetted designer marketplace with role-specific take-home briefs and a paid micro-trial workflow.",
    painPoint:
      "Small startups (8-person SaaS) spend 3+ months failing to hire quality product designers after posting on job boards (Indeed, LinkedIn, AngelList), receiving zero applications or only low-quality/spam applicants.",
    targetAudience:
      "8-15 person B2B SaaS startups without in-house designers trying to hire a full-time or contract product designer",
    category: "Hiring",
    sources: [
      "https://reddit.com/r/startups/comments/1ntklr9/how_are_small_startups_finding_good_product/",
    ],
    score: 72,
    scoreBreakdown: {
      painSeverity: 15,
      marketSize: 21,
      competition: 18,
      feasibility: 10,
      engagement: 8,
      total: 72,
      reasoning:
        "Medium severity pain with good market size. Moderate competition with clear differentiation opportunities.",
    },
    generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    confidence: 0.85,
  },
];

export default function IdeasPage() {
  const handleRefresh = () => {
    // TODO: Implement refresh logic to fetch new ideas
    console.log("Refreshing ideas...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ideas Feed</h1>
          <p className="text-muted-foreground">
            Discover product opportunities from real user pain points
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Ideas Feed */}
      <IdeasFeed ideas={mockIdeas} />
    </div>
  );
}
