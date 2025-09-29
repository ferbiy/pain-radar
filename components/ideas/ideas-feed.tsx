"use client";

import { useState, useMemo, useEffect } from "react";
import { IdeaCard } from "./idea-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import { ProductIdea } from "@/types";

interface IdeasFeedProps {
  ideas: ProductIdea[];
  isLoading?: boolean;
}

const CATEGORIES = [
  "All",
  "Marketing",
  "Hiring",
  "Technical",
  "Productivity",
  "Financial",
  "Other",
];

export function IdeasFeed({ ideas, isLoading = false }: IdeasFeedProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"score" | "date">("score");

  // Restore filter preferences from localStorage on mount
  useEffect(() => {
    const savedCategory = localStorage.getItem("ideas-filter-category");
    const savedSort = localStorage.getItem("ideas-filter-sort");

    if (savedCategory) setSelectedCategory(savedCategory);
    if (savedSort) setSortBy(savedSort as "score" | "date");
  }, []);

  // Persist filter preferences to localStorage
  useEffect(() => {
    localStorage.setItem("ideas-filter-category", selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    localStorage.setItem("ideas-filter-sort", sortBy);
  }, [sortBy]);

  // Filter ideas based on search and category (memoized for performance)
  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchesSearch =
        searchQuery === "" ||
        idea.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.pitch.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.painPoint.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        idea.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [ideas, searchQuery, selectedCategory]);

  // Sort ideas (memoized for performance)
  const sortedIdeas = useMemo(() => {
    return [...filteredIdeas].sort((a, b) => {
      if (sortBy === "score") {
        return b.score - a.score;
      } else {
        const dateA = new Date(a.generatedAt || 0).getTime();
        const dateB = new Date(b.generatedAt || 0).getTime();

        return dateB - dateA;
      }
    });
  }, [filteredIdeas, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Product Ideas</h2>
          <p className="text-muted-foreground">
            {sortedIdeas.length} {sortedIdeas.length === 1 ? "idea" : "ideas"}{" "}
            found
          </p>
        </div>

        {/* Sort Toggle */}
        <div className="flex gap-2">
          <Button
            variant={sortBy === "score" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("score")}
          >
            Top Rated
          </Button>
          <Button
            variant={sortBy === "date" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("date")}
          >
            Most Recent
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ideas, pain points, or audiences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {CATEGORIES.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              Loading ideas...
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && sortedIdeas.length === 0 && (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed">
          <p className="text-lg font-medium">No ideas found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery || selectedCategory !== "All"
              ? "Try adjusting your filters"
              : "Run the AI workflow to generate product ideas"}
          </p>
        </div>
      )}

      {/* Ideas Grid */}
      {!isLoading && sortedIdeas.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {sortedIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              isNew={
                idea.generatedAt
                  ? new Date(idea.generatedAt).getTime() >
                    Date.now() - 24 * 60 * 60 * 1000
                  : false
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
