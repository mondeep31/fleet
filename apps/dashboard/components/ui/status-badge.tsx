import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DeploymentStatus } from "@/lib/types";

const statusConfig: Record<
  DeploymentStatus,
  { label: string; className: string }
> = {
  queued: {
    label: "Queued",
    className: "bg-[#777]/12 text-[#a3a3a3] border-[#777]/24",
  },
  cloning: {
    label: "Cloning",
    className: "bg-[#d99a48]/12 text-[#e6ad65] border-[#d99a48]/24",
  },
  cloned: {
    label: "Cloned",
    className: "bg-[#d99a48]/12 text-[#e6ad65] border-[#d99a48]/24",
  },
  building: {
    label: "Building",
    className: "bg-[#d99a48]/12 text-[#e6ad65] border-[#d99a48]/24",
  },
  deploying: {
    label: "Deploying",
    className: "bg-[#d99a48]/12 text-[#e6ad65] border-[#d99a48]/24",
  },
  live: {
    label: "Live",
    className: "bg-[#45b97c]/12 text-[#69cc93] border-[#45b97c]/24",
  },
  failed: {
    label: "Failed",
    className: "bg-[#e45c53]/12 text-[#ee7b73] border-[#e45c53]/24",
  },
  rolled_back: {
    label: "Rolled Back",
    className: "bg-[#e45c53]/12 text-[#ee7b73] border-[#e45c53]/24",
  },
  stopped: {
    label: "Stopped",
    className: "bg-[#777]/12 text-[#a3a3a3] border-[#777]/24",
  },
  deleted: {
    label: "Deleted",
    className: "bg-[#777]/12 text-[#a3a3a3] border-[#777]/24",
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
