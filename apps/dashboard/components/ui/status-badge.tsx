import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DeploymentStatus } from "@/lib/types";

const statusConfig: Record<
  DeploymentStatus,
  { label: string; className: string }
> = {
  queued: {
    label: "Queued",
    className: "bg-[#75807a]/10 text-[#5f6a64] border-[#75807a]/22",
  },
  cloning: {
    label: "Cloning",
    className: "bg-[#bd7b2d]/10 text-[#8b5619] border-[#bd7b2d]/25",
  },
  cloned: {
    label: "Cloned",
    className: "bg-[#bd7b2d]/10 text-[#8b5619] border-[#bd7b2d]/25",
  },
  building: {
    label: "Building",
    className: "bg-[#bd7b2d]/10 text-[#8b5619] border-[#bd7b2d]/25",
  },
  deploying: {
    label: "Deploying",
    className: "bg-[#bd7b2d]/10 text-[#8b5619] border-[#bd7b2d]/25",
  },
  live: {
    label: "Live",
    className: "bg-[#248252]/10 text-[#17633b] border-[#248252]/24",
  },
  failed: {
    label: "Failed",
    className: "bg-[#b64f45]/10 text-[#963d35] border-[#b64f45]/24",
  },
  rolled_back: {
    label: "Rolled Back",
    className: "bg-[#b64f45]/10 text-[#963d35] border-[#b64f45]/24",
  },
  stopped: {
    label: "Stopped",
    className: "bg-[#75807a]/10 text-[#5f6a64] border-[#75807a]/22",
  },
  deleted: {
    label: "Deleted",
    className: "bg-[#75807a]/10 text-[#5f6a64] border-[#75807a]/22",
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
