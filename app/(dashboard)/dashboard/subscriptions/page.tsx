"use client";

import { SubscribeForm } from "@/components/subscriptions/subscribe-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, Mail, Zap } from "lucide-react";

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-8 w-8 text-primary" />
          Email Subscriptions
        </h1>
        <p className="text-muted-foreground mt-1">
          Get weekly product ideas delivered to your inbox
        </p>
      </div>

      {/* Features */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-5 w-5 text-primary" />
              Weekly Digests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Receive curated product ideas every week based on your selected
              topics
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-5 w-5 text-primary" />
              High Quality Ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Only the best ideas (70+ score) make it to your inbox
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5 text-primary" />
              Unsubscribe Anytime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Cancel your subscription with one click, no questions asked
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Form */}
      <Card>
        <CardHeader>
          <CardTitle>Subscribe to Ideas</CardTitle>
          <CardDescription>
            Choose topics you&apos;re interested in and get weekly updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscribeForm />
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-sm">Select Your Topics</h4>
                <p className="text-sm text-muted-foreground">
                  Choose from Marketing, Hiring, Technical, Productivity, or
                  Financial
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-sm">
                  Receive Weekly Digests
                </h4>
                <p className="text-sm text-muted-foreground">
                  Every week, we&apos;ll send you the top ideas matching your
                  topics
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-sm">
                  Discover Opportunities
                </h4>
                <p className="text-sm text-muted-foreground">
                  Click through to explore full details and start building
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
