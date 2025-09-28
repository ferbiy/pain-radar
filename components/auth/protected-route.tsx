"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoadingPage } from "@/components/ui/loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  fallback,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Add current path as redirect parameter
      const currentPath = window.location.pathname;
      const redirectUrl = `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`;

      router.push(redirectUrl);
    }
  }, [user, loading, router, redirectTo]);

  // Show loading state
  if (loading) {
    return fallback || <LoadingPage text="Checking authentication..." />;
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!user) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}
