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
      // Preserve full path including query params and hash
      const { pathname, search, hash } = window.location;
      const currentPath = `${pathname}${search}${hash}`;

      // Safely construct redirect URL to handle existing query params
      const url = new URL(redirectTo, window.location.origin);

      url.searchParams.set("redirectTo", currentPath);

      router.push(`${url.pathname}${url.search}${url.hash}`);
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
