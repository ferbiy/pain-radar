"use client";

import { useEffect, useState } from "react";
import { IdeasFeed } from "@/components/ideas/ideas-feed";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { ProductIdea } from "@/types";

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<ProductIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchIdeas = async () => {
    try {
      const response = await fetch("/api/ideas");
      const data = await response.json();

      if (response.ok && data.success) {
        setIdeas(data.ideas);
      } else {
        console.error("Failed to fetch ideas:", data.error);
      }
    } catch (error) {
      console.error("Error fetching ideas:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch ideas on mount
  useEffect(() => {
    fetchIdeas();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchIdeas();
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
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Ideas Feed */}
      <IdeasFeed ideas={ideas} isLoading={isLoading} />
    </div>
  );
}
