"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  TrendingUp,
  Users,
  Zap,
  Play,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { GenerationProgress } from "@/components/dashboard/generation-progress";
import Link from "next/link";
import type { ProductIdea } from "@/types";

interface DashboardStats {
  totalIdeas: number;
  highPotential: number;
  activeSubscriptions: number;
  newToday: number;
}

export default function DashboardPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalIdeas: 0,
    highPotential: 0,
    activeSubscriptions: 0,
    newToday: 0,
  });
  const [recentIdeas, setRecentIdeas] = useState<ProductIdea[]>([]);
  const [trendingCategories, setTrendingCategories] = useState<
    { category: string; count: number }[]
  >([]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/ideas?limit=100");
      const data = await response.json();

      if (response.ok && data.success) {
        const ideas = data.ideas as ProductIdea[];

        // Calculate stats
        const totalIdeas = ideas.length;
        const highPotential = ideas.filter((idea) => idea.score >= 70).length;
        const today = new Date();

        today.setHours(0, 0, 0, 0);
        const newToday = ideas.filter((idea) => {
          const ideaDate = new Date(idea.generatedAt || "");

          ideaDate.setHours(0, 0, 0, 0);

          return ideaDate.getTime() === today.getTime();
        }).length;

        setStats({
          totalIdeas,
          highPotential,
          activeSubscriptions: 0, // TODO: Fetch from subscriptions API
          newToday,
        });

        // Recent ideas (top 5)
        setRecentIdeas(ideas.slice(0, 5));

        // Trending categories
        const categoryCount: Record<string, number> = {};

        ideas.forEach((idea) => {
          categoryCount[idea.category] =
            (categoryCount[idea.category] || 0) + 1;
        });

        const trending = Object.entries(categoryCount)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTrendingCategories(trending);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleGenerateIdeas = async () => {
    setIsGenerating(true);

    toast.info("Starting idea generation...", {
      description: "This will take 2-3 minutes. You can explore while we work!",
    });

    try {
      const response = await fetch("/api/cron/generate", {
        method: "POST",
        headers: {
          "x-cron-secret": process.env.NEXT_PUBLIC_CRON_SECRET || "",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setLastRun(new Date().toLocaleString());
        toast.success("Ideas generated successfully!", {
          description: `Generated ${data.ideasGenerated} ideas in ${(data.processingTime / 1000).toFixed(1)}s`,
        });
        // Refresh dashboard data
        fetchDashboardData();
      } else {
        toast.error("Generation failed", {
          description: data.error || "An unexpected error occurred",
        });
      }
    } catch (error) {
      toast.error("Generation failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 px-8">
      {/* Progress Dialog */}
      <GenerationProgress
        isOpen={isGenerating}
        onOpenChange={setIsGenerating}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Track product ideas and market trends from Reddit
          </p>
        </div>
        <div className="space-y-2">
          <Button
            onClick={handleGenerateIdeas}
            disabled={isGenerating}
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Generate Ideas
              </>
            )}
          </Button>
          {lastRun && (
            <p className="text-xs text-muted-foreground">Last run: {lastRun}</p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ideas</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIdeas}</div>
            <p className="text-xs text-muted-foreground">All generated ideas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              High-Potential
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highPotential}</div>
            <p className="text-xs text-muted-foreground">Ideas scored 70+</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Subscriptions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeSubscriptions}
            </div>
            <p className="text-xs text-muted-foreground">Email preferences</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Today</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newToday}</div>
            <p className="text-xs text-muted-foreground">Fresh insights</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Ideas</CardTitle>
            <Link
              href="/dashboard/ideas"
              className="text-sm text-primary hover:underline"
            >
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {recentIdeas.length > 0 ? (
              <div className="space-y-3">
                {recentIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">
                          {idea.name}
                        </h4>
                        <span className="text-xs font-semibold text-primary">
                          {idea.score}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {idea.pitch}
                      </p>
                    </div>
                    <Link
                      href="/dashboard/ideas"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                No ideas yet. Run the AI workflow to generate insights.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {trendingCategories.length > 0 ? (
              <div className="space-y-3">
                {trendingCategories.map((cat) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium text-sm capitalize">
                        {cat.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {cat.count} {cat.count === 1 ? "idea" : "ideas"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Category insights will appear here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
