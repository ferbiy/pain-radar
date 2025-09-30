"use client";

import { Database, Brain, TrendingUp, Mail } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Database,
    title: "Data Collection",
    description:
      "Our AI continuously monitors trending posts from 50+ startup and tech subreddits, collecting thousands of conversations daily.",
  },
  {
    number: "02",
    icon: Brain,
    title: "AI Analysis",
    description:
      "Advanced language models extract pain points, analyze sentiment, categorize problems, and identify patterns across discussions.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Idea Generation",
    description:
      "AI transforms pain points into actionable product ideas, complete with pitches, target audiences, and market potential scores.",
  },
  {
    number: "04",
    icon: Mail,
    title: "Delivery & Tracking",
    description:
      "Browse ideas in your dashboard, filter by category, and subscribe to weekly digests with the highest-scoring opportunities.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-muted/30 px-6 py-24 sm:py-32 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From Reddit discussions to validated product ideas in 4 simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid gap-12 md:gap-16">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="group relative flex flex-col gap-6 md:flex-row md:gap-8"
              >
                {/* Connector line (not for last item) */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-20 hidden h-full w-px bg-gradient-to-b from-primary/50 to-transparent md:block" />
                )}

                {/* Step number and icon */}
                <div className="relative flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="absolute -bottom-6 left-0 text-6xl font-bold text-muted/10">
                    {step.number}
                  </div>
                </div>

                {/* Step content */}
                <div className="flex-1 pt-1">
                  <h3 className="text-2xl font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-lg text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
