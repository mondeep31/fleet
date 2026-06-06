import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DeploymentStatus } from "@/lib/types";

const statusConfig: Record<
  DeploymentStatus,
  { label: string; className: string }
> = {
  queued: {
    label: "Queued",
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  },
  cloning: {
    label: "Cloning",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  },
  cloned: {
    label: "Cloned",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  },
  building: {
    label: "Building",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  },
  deploying: {
    label: "Deploying",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  },
  live: {
    label: "Live",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  },
  failed: {
    label: "Failed",
    className: "bg-red-500/15 text-red-400 border-red-500/20",
  },
  rolled_back: {
    label: "Rolled Back",
    className: "bg-red-500/15 text-red-400 border-red-500/20",
  },
  stopped: {
    label: "Stopped",
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: DeploymentStatus;
  className?: string;
}) {
  const config = statusConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium tabular-nums",
        config.className,
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}
