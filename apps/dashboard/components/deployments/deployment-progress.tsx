"use client";

import { cn } from "@/lib/utils";
import type { DeploymentStatus } from "@/lib/types";

const STEPS: { key: DeploymentStatus; label: string }[] = [
  { key: "queued", label: "Queued" },
  { key: "cloning", label: "Clone" },
  { key: "building", label: "Build" },
  { key: "deploying", label: "Deploy" },
  { key: "live", label: "Live" },
];

function getStepIndex(status: DeploymentStatus): number {
  switch (status) {
    case "queued":
      return 0;
    case "cloning":
    case "cloned":
      return 1;
    case "building":
      return 2;
    case "deploying":
      return 3;
    case "live":
      return 4;
    case "failed":
    case "stopped":
    case "deleted":
    case "rolled_back":
      return -1;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function DeploymentProgress({ status }: { status: DeploymentStatus }) {
  const currentIndex = getStepIndex(status);
  const isFailed =
    status === "failed" ||
    status === "stopped" ||
    status === "deleted" ||
    status === "rolled_back";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const completed = currentIndex > index;
          const active = currentIndex === index && !isFailed;
          const failedAtStep = isFailed && currentIndex === index;

          return (
            <div key={step.key} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border text-xs font-medium tabular-nums transition-colors",
                  completed && "border-emerald-600/30 bg-emerald-600/10 text-emerald-700",
                  active && "border-amber-600/30 bg-amber-600/10 text-amber-700",
                  failedAtStep && "border-red-600/30 bg-red-600/10 text-red-700",
                  !completed && !active && !failedAtStep &&
                    "border-border bg-[var(--bg-elevated)] text-muted-foreground",
                )}
              >
                {index + 1}
              </div>
              <span
                className={cn(
                  "text-xs",
                  active || completed
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-elevated)] shadow-[inset_0_1px_2px_rgba(18,28,23,0.12)]">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            isFailed ? "bg-red-500" : "bg-emerald-500",
          )}
          style={{
            width: isFailed
              ? "100%"
              : `${Math.max(0, (currentIndex / (STEPS.length - 1)) * 100)}%`,
          }}
        />
      </div>
    </div>
  );
}
