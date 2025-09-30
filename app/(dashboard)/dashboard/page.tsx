"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, TrendingUp, Users, Zap, Play } from "lucide-react";

export default function DashboardPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const handleGenerateIdeas = async () => {
    setIsGenerating(true);

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
        alert(
          `✅ Success! Generated ${data.ideasGenerated} ideas in ${(data.processingTime / 1000).toFixed(1)}s`
        );
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 px-8">
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
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">+0% from last month</p>
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
            <div className="text-2xl font-bold">0</div>
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
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Email preferences</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Today</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Fresh insights</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              No ideas yet. Run the AI workflow to generate insights.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Category insights will appear here.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
