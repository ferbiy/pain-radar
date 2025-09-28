"use client";

import { useState } from "react";
import Link from "next/link";
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
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validations/auth";

interface ResetPasswordFormProps {
  onSubmit: (data: ResetPasswordFormData) => Promise<{ error?: string } | void>;
}

export function ResetPasswordForm({ onSubmit }: ResetPasswordFormProps) {
  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Hooks
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Callbacks
  const handleFormSubmit: ResetPasswordFormProps["onSubmit"] = async (data) => {
    setError("");
    setLoading(true);

    try {
      const result = await onSubmit(data);

      if (result?.error) {
        setError(result.error);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Reset your password
          </CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset
            your password.{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Back to sign in
            </Link>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-destructive text-sm">
                  {errors.email.message}
                </p>
              )}
            </div>

            {error && (
              <div className="text-destructive text-sm text-center">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
