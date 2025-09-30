"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Bell, Tag, LogOut, ExternalLink, Info } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { useState } from "react";
import { toast } from "sonner";

const CATEGORIES = [
  "Marketing",
  "Hiring",
  "Technical",
  "Productivity",
  "Financial",
  "Other",
];

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly (Recommended)" },
  { value: "monthly", label: "Monthly" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "Marketing",
    "Technical",
  ]);
  const [frequency, setFrequency] = useState("weekly");

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSavePreferences = () => {
    toast.success("Preferences saved!", {
      description: "Your settings have been updated successfully.",
    });
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Info Notice */}
      <div className="max-w-2xl rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Preview Mode
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Your account data is real, but preference saving and other actions
              are not yet functional. These features will be implemented soon.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <p className="text-sm text-muted-foreground mt-1">
                {user?.email || "Not logged in"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Account ID</label>
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                {user?.id?.substring(0, 20)}...
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Change Password <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Email Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Email Preferences
            </CardTitle>
            <CardDescription>
              Choose how often you want to receive idea digests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-3 block">
                Notification Frequency
              </label>
              <div className="flex flex-col gap-2">
                {FREQUENCIES.map((freq) => (
                  <label
                    key={freq.value}
                    className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md"
                  >
                    <input
                      type="radio"
                      name="frequency"
                      value={freq.value}
                      checked={frequency === freq.value}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{freq.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Topic Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Topic Preferences
            </CardTitle>
            <CardDescription>
              Select categories you&apos;re interested in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-3 block">
                Interested Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <Badge
                    key={category}
                    variant={
                      selectedCategories.includes(category)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Selected {selectedCategories.length} of {CATEGORIES.length}{" "}
                categories
              </p>
            </div>
            <Button onClick={handleSavePreferences}>Save Preferences</Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <LogOut className="h-5 w-5" />
              Account Actions
            </CardTitle>
            <CardDescription>Manage your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleLogout}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
