"use client";

import {
  Brain,
  TrendingUp,
  Zap,
  Target,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: MessageSquare,
    title: "Reddit Pain Point Analysis",
    description:
      "Our AI scans trending posts across 50+ subreddits to identify real user frustrations, complaints, and unmet needs.",
  },
  {
    icon: Brain,
    title: "AI-Powered Idea Generation",
    description:
      "Advanced LLM technology transforms pain points into creative, actionable product concepts with detailed pitches.",
  },
  {
    icon: BarChart3,
    title: "Market Potential Scoring",
    description:
      "Every idea is automatically scored (0-100) based on pain severity, market size, competition, and feasibility.",
  },
  {
    icon: Target,
    title: "Targeted Audience Insights",
    description:
      "Get specific target audience profiles for each idea, helping you focus on the right customer segment.",
  },
  {
    icon: TrendingUp,
    title: "Trend Detection",
    description:
      "Spot emerging opportunities before they become mainstream by tracking discussion patterns and sentiment.",
  },
  {
    icon: Zap,
    title: "Weekly Email Digests",
    description:
      "Never miss a great idea. Subscribe to categories you care about and get the best ideas delivered to your inbox.",
  },
];

export function Features() {
  return (
    <section id="features" className="px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Discover Your Next Big Idea
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful features designed to help founders, indie hackers, and
            product managers identify validated opportunities.
          </p>
        </div>

        {/* Features grid */}
        <div className="mx-auto mt-16 grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden transition-all hover:shadow-lg"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
