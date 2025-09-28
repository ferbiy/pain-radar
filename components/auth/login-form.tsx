"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { LoadingPage } from "@/components/ui/loading";

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<{ error?: string } | void>;
}

function LoginFormContent({ onSubmit }: LoginFormProps) {
  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Callbacks
  const handleFormSubmit: LoginFormProps["onSubmit"] = async (data) => {
    setError("");
    setLoading(true);

    try {
      const result = await onSubmit(data);

      if (result?.error) {
        setError(result.error);
      } else {
        // Successful login - redirect will be handled by middleware or server action
        // But we can also handle it here as a fallback
        if (redirectTo && isValidRedirectUrl(redirectTo)) {
          router.push(redirectTo);
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to validate redirect URLs (same as middleware)
  const isValidRedirectUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url, window.location.origin);

      return (
        parsed.pathname.startsWith("/") && !parsed.pathname.startsWith("//")
      );
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Sign in to your account
          </CardTitle>
          <CardDescription>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </CardDescription>
        </CardHeader>

        <CardContent>
          {redirectTo && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                Please sign in to continue to your requested page.
              </p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-destructive text-sm">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-destructive text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <div className="text-destructive text-sm text-center">
                {error}
              </div>
            )}

            <div className="text-center">
              <Link
                href="/reset-password"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Forgot your password?
              </Link>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  return (
    <Suspense fallback={<LoadingPage text="Loading login form..." />}>
      <LoginFormContent onSubmit={onSubmit} />
    </Suspense>
  );
}
