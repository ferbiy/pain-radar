"use client";

import { signIn } from "@/lib/auth/actions";
import { LoginForm } from "@/components/auth/login-form";
import type { LoginFormData } from "@/lib/validations/auth";

export default function LoginPage() {
  const handleSubmit = async (data: LoginFormData) => {
    return await signIn(data.email, data.password);
  };

  return <LoginForm onSubmit={handleSubmit} />;
}
