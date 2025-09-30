"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2 } from "lucide-react";

interface GenerationProgressProps {
  isOpen: boolean;
  onOpenChange: (_open: boolean) => void;
}

const STEPS = [
  { id: 1, name: "Fetching Reddit Data", duration: 10000 },
  { id: 2, name: "Extracting Pain Points", duration: 40000 },
  { id: 3, name: "Generating Ideas", duration: 40000 },
  { id: 4, name: "Scoring & Analysis", duration: 30000 },
  { id: 5, name: "Storing Results", duration: 5000 },
];

export function GenerationProgress({
  isOpen,
  onOpenChange,
}: GenerationProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setProgress(0);

      return;
    }

    // Simulate progress through steps
    const totalDuration = STEPS.reduce((sum, step) => sum + step.duration, 0);
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 100;
      const currentProgress = Math.min((elapsed / totalDuration) * 100, 99);

      setProgress(currentProgress);

      // Update current step based on elapsed time
      let cumulativeDuration = 0;

      for (let i = 0; i < STEPS.length; i++) {
        cumulativeDuration += STEPS[i].duration;

        if (elapsed < cumulativeDuration) {
          setCurrentStep(i);
          break;
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generating Product Ideas</DialogTitle>
          <DialogDescription>
            AI is analyzing Reddit discussions to discover opportunities...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-right">
              {Math.round(progress)}% complete
            </p>
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3 text-sm">
                {index < currentStep ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : index === currentStep ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted flex-shrink-0" />
                )}
                <span
                  className={
                    index <= currentStep
                      ? "font-medium"
                      : "text-muted-foreground"
                  }
                >
                  {step.name}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            ⏱️ This process takes 2-3 minutes. Feel free to explore the app
            while we work!
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
