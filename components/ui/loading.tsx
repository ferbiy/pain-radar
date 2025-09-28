import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function Loading({ className, size = "md", text }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const label = text?.trim() ? text : "Loading...";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center space-y-2",
        className
      )}
    >
      <Loader2
        className={cn("animate-spin text-primary", sizeClasses[size])}
        aria-hidden="true"
      />
      {text?.trim() ? (
        <p className="text-sm text-muted-foreground">{text}</p>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}

export function LoadingPage({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loading size="lg" text={text} />
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <span role="status" aria-label="Loading">
      <Loader2
        className={cn("h-4 w-4 animate-spin", className)}
        aria-hidden="true"
      />
    </span>
  );
}
