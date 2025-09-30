"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

const TOPICS = [
  "Marketing",
  "Hiring",
  "Technical",
  "Productivity",
  "Financial",
];

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, topics: selectedTopics }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Subscribed! Check your email for updates.");
        setEmail("");
        setSelectedTopics([]);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage("❌ Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Subscribe to Ideas</h3>
      </div>

      <Input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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

      <Button
        type="submit"
        disabled={isSubmitting || selectedTopics.length === 0}
      >
        {isSubmitting ? "Subscribing..." : "Subscribe"}
      </Button>

      {message && <p className="text-sm">{message}</p>}
    </form>
  );
}
