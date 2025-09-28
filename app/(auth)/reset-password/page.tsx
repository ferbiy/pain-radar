"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import type { ResetPasswordFormData } from "@/lib/validations/auth";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState("");

  const supabase = createClient();

  const handleSubmit = async (data: ResetPasswordFormData) => {
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password/confirm`,
    });

    if (error) {
      return { error: error.message };
    } else {
      setMessage(
        "Check your email for a password reset link. It may take a few minutes to arrive."
      );
    }
  };

  if (message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold">Check your email</h2>
          <p className="text-muted-foreground">{message}</p>
          <a
            href="/login"
            className="inline-block text-primary hover:underline"
          >
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return <ResetPasswordForm onSubmit={handleSubmit} />;
}
