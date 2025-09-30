"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Edit } from "lucide-react";
import { toast } from "sonner";

const TOPICS = [
  "Marketing",
  "Hiring",
  "Technical",
  "Productivity",
  "Financial",
];

interface StoredSubscription {
  email: string;
  topics: string[];
}

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingSubscription, setExistingSubscription] =
    useState<StoredSubscription | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Check for existing subscription on mount
  useEffect(() => {
    const stored = localStorage.getItem("subscription");

    if (stored) {
      try {
        const subscription = JSON.parse(stored) as StoredSubscription;

        setExistingSubscription(subscription);
        setEmail(subscription.email);
        setSelectedTopics(subscription.topics);
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, topics: selectedTopics }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store subscription in localStorage
        const subscription: StoredSubscription = {
          email,
          topics: selectedTopics,
        };

        localStorage.setItem("subscription", JSON.stringify(subscription));
        setExistingSubscription(subscription);
        setIsEditing(false);

        toast.success("Subscribed successfully!", {
          description: "You'll receive weekly product ideas in your inbox.",
        });
      } else {
        toast.error("Subscription failed", {
          description: data.error || "Please try again.",
        });
      }
    } catch {
      toast.error("Subscription failed", {
        description: "Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (existingSubscription) {
      setEmail(existingSubscription.email);
      setSelectedTopics(existingSubscription.topics);
    }
    setIsEditing(false);
  };

  // Show existing subscription if subscribed and not editing
  if (existingSubscription && !isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Active Subscription</h3>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{existingSubscription.email}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Subscribed Topics
            </p>
            <div className="flex flex-wrap gap-2">
              {existingSubscription.topics.map((topic) => (
                <Badge key={topic} variant="default">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={handleEdit} variant="outline" className="w-full">
          <Edit className="h-4 w-4 mr-2" />
          Update Topics
        </Button>
      </div>
    );
  }

  // Show subscription form
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">
          {existingSubscription ? "Update Subscription" : "Subscribe to Ideas"}
        </h3>
      </div>

      <Input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={!!existingSubscription}
        required
      />

      <div>
        <p className="mb-2 text-sm text-muted-foreground">Select topics:</p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((topic) => (
            <Badge
              key={topic}
              variant={selectedTopics.includes(topic) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTopic(topic)}
            >
              {topic}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isSubmitting || selectedTopics.length === 0}
          className="flex-1"
        >
          {isSubmitting
            ? "Saving..."
            : existingSubscription
              ? "Update"
              : "Subscribe"}
        </Button>
        {existingSubscription && (
          <Button type="button" onClick={handleCancel} variant="outline">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
