"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Flame } from "lucide-react";
import Link from "next/link";
import type { ProductIdea } from "@/types";

export default function TrendingPage() {
  const [trendingIdeas, setTrendingIdeas] = useState<ProductIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingIdeas = async () => {
      try {
        const response = await fetch("/api/ideas?limit=10");
        const data = await response.json();

        if (response.ok && data.success) {
          // Sort by score descending to get trending/high-potential ideas
          const sorted = [...data.ideas].sort((a, b) => b.score - a.score);

          setTrendingIdeas(sorted.slice(0, 10));
        }
      } catch (error) {
        console.error("Failed to fetch trending ideas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingIdeas();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Flame className="h-8 w-8 text-orange-500" />
          Trending Ideas
        </h1>
        <p className="text-muted-foreground mt-1">
          Top-rated product ideas with the highest potential
        </p>
      </div>

      {/* Trending Ideas */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              Loading trending ideas...
            </p>
          </div>
        </div>
      ) : trendingIdeas.length > 0 ? (
        <div className="space-y-4">
          {trendingIdeas.map((idea, index) => (
            <Card key={idea.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-bold">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl">{idea.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {idea.pitch}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-2xl font-bold text-primary">
                        {idea.score}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">Score</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Pain Point</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {idea.painPoint}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      Target Audience
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {idea.targetAudience}
                    </p>
                  </div>
                </div>

                {idea.scoreBreakdown && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-2">
                      Score Breakdown
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                      <div className="text-center p-2 rounded bg-muted">
                        <div className="font-semibold">
                          {idea.scoreBreakdown.painSeverity}/30
                        </div>
                        <div className="text-muted-foreground">Pain</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted">
                        <div className="font-semibold">
                          {idea.scoreBreakdown.marketSize}/25
                        </div>
                        <div className="text-muted-foreground">Market</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted">
                        <div className="font-semibold">
                          {idea.scoreBreakdown.competition}/20
                        </div>
                        <div className="text-muted-foreground">Competition</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted">
                        <div className="font-semibold">
                          {idea.scoreBreakdown.feasibility}/15
                        </div>
                        <div className="text-muted-foreground">Feasibility</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted">
                        <div className="font-semibold">
                          {idea.scoreBreakdown.engagement}/10
                        </div>
                        <div className="text-muted-foreground">Engagement</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {idea.category}
                  </span>
                  <Link
                    href="/dashboard/ideas"
                    className="text-sm text-primary hover:underline"
                  >
                    View in Ideas Feed →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Trending Ideas</h3>
              <p className="text-sm text-muted-foreground">
                Generate some ideas to see trending opportunities here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
