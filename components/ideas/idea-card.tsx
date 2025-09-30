import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  ExternalLink,
  Sparkles,
  Target,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { ProductIdea } from "@/types";

interface IdeaCardProps {
  idea: ProductIdea;
  isNew?: boolean;
}

export function IdeaCard({ idea, isNew = false }: IdeaCardProps) {
  // Determine score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";

    return "text-gray-600 dark:text-gray-400";
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      marketing:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      hiring: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      technical:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      productivity:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      financial:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };

    return colors[category.toLowerCase()] || colors.other;
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{idea.name}</CardTitle>
              {isNew && (
                <Badge variant="default" className="text-xs">
                  <Sparkles className="mr-1 h-3 w-3" />
                  New
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={getCategoryColor(idea.category)}
              >
                {idea.category}
              </Badge>
              {idea.confidence && (
                <span className="text-xs text-muted-foreground">
                  {Math.round(idea.confidence * 100)}% confidence
                </span>
              )}
            </div>
          </div>

          {/* Score Badge */}
          <div className="flex flex-col items-center gap-1 rounded-lg bg-muted p-3">
            <div className={`text-2xl font-bold ${getScoreColor(idea.score)}`}>
              {idea.score}
            </div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pitch */}
        <div>
          <p className="text-sm leading-relaxed text-foreground">
            {idea.pitch}
          </p>
        </div>

        {/* Pain Point */}
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            Pain Point
          </div>
          <p className="text-sm">{idea.painPoint}</p>
        </div>

        {/* Target Audience */}
        <div className="flex items-start gap-2">
          <Target className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">
              Target Audience
            </p>
            <p className="text-sm">{idea.targetAudience}</p>
          </div>
        </div>

        {/* Score Breakdown */}
        {idea.scoreBreakdown && (
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center gap-1 text-xs font-medium">
              <BarChart3 className="h-3 w-3" />
              Score Breakdown
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pain Severity:</span>
                <span className="font-medium">
                  {idea.scoreBreakdown.painSeverity}/30
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market Size:</span>
                <span className="font-medium">
                  {idea.scoreBreakdown.marketSize}/25
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Competition:</span>
                <span className="font-medium">
                  {idea.scoreBreakdown.competition}/20
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Feasibility:</span>
                <span className="font-medium">
                  {idea.scoreBreakdown.feasibility}/15
                </span>
              </div>
            </div>
            {idea.scoreBreakdown.reasoning && (
              <p className="mt-2 text-xs text-muted-foreground">
                {idea.scoreBreakdown.reasoning}
              </p>
            )}
          </div>
        )}

        {/* Sources */}
        {idea.sources && idea.sources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {idea.sources.slice(0, 2).map((source, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                asChild
                className="h-8 text-xs"
              >
                <Link href={source} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Source {idx + 1}
                </Link>
              </Button>
            ))}
          </div>
        )}

        {/* Metadata */}
        {idea.generatedAt && (
          <div className="pt-2 text-xs text-muted-foreground">
            Generated {new Date(idea.generatedAt).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
