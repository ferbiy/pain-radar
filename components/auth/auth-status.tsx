"use client";

import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface AuthStatusProps {
  showFullStatus?: boolean;
}

export function AuthStatus({ showFullStatus = false }: AuthStatusProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        {showFullStatus && (
          <span className="text-sm text-muted-foreground">Loading...</span>
        )}
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        {showFullStatus && (
          <span className="text-sm text-muted-foreground">
            Signed in as {user.email}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="h-2 w-2 rounded-full bg-gray-400" />
      {showFullStatus && (
        <span className="text-sm text-muted-foreground">Not signed in</span>
      )}
    </div>
  );
}
