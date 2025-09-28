"use client";

import { signUp } from "@/lib/auth/actions";
import { SignUpForm } from "@/components/auth/signup-form";
import type { SignUpFormData } from "@/lib/validations/auth";

export default function SignUpPage() {
  const handleSubmit = async (data: SignUpFormData) => {
    return await signUp(data.email, data.password);
  };

  return <SignUpForm onSubmit={handleSubmit} />;
}
