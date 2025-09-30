"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 px-6 py-24 sm:py-32 lg:px-8">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl opacity-30">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-primary to-purple-600 opacity-30" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Badge */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">AI-Powered Product Discovery</span>
          </div>
        </div>

        {/* Logo + Heading */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
          <Image
            src="/logo.png"
            alt="Pain Radar"
            width={100}
            height={100}
            className="transition-transform hover:scale-110 shrink-0"
            priority
          />

          <h1 className="text-4xl font-bold tracking-tight text-center sm:text-6xl lg:text-7xl">
            Turn Reddit Pain Points Into{" "}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Validated Product Ideas
            </span>
          </h1>
        </div>

        {/* Subheading */}
        <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl text-center">
          Stop guessing what to build. Our AI analyzes thousands of Reddit posts
          to uncover real user problems, then generates actionable startup ideas
          ranked by market potential.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="group">
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">
              <Lightbulb className="mr-2 h-4 w-4" />
              View Sample Ideas
            </Link>
          </Button>
        </div>

        {/* Social proof */}
        <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
          <div className="text-center">
            <div className="text-3xl font-bold">1000+</div>
            <div className="text-sm text-muted-foreground">Ideas Generated</div>
          </div>
          <div className="hidden h-12 w-px bg-border sm:block" />
          <div className="text-center">
            <div className="text-3xl font-bold">50+</div>
            <div className="text-sm text-muted-foreground">
              Subreddits Analyzed
            </div>
          </div>
          <div className="hidden h-12 w-px bg-border sm:block" />
          <div className="text-center">
            <div className="text-3xl font-bold">95%</div>
            <div className="text-sm text-muted-foreground">Accuracy Score</div>
          </div>
        </div>
      </div>
    </section>
  );
}
