"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTA() {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-purple-500/10 to-background" />
      <div className="absolute inset-0 -z-10 bg-grid-white/5" />

      <div className="mx-auto max-w-4xl text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-8 w-8" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Ready to Discover Your Next Big Idea?
        </h2>

        {/* Subheading */}
        <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
          Join hundreds of founders and indie hackers who use Pain Radar to stay
          ahead of market trends and validate their next startup concept.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="group">
            <Link href="/signup">
              Start Free Today
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 text-sm text-muted-foreground sm:flex-row sm:gap-8">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-green-500"
              fill="none"
              strokeWidth={2}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-green-500"
              fill="none"
              strokeWidth={2}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Free forever plan</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-green-500"
              fill="none"
              strokeWidth={2}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}
