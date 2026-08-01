import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DeploymentStatus } from "@/lib/types";

const statusConfig: Record<
  DeploymentStatus,
  { label: string; className: string }
> = {
  queued: {
    label: "Queued",
    className: "bg-[#71807a]/12 text-[#93a19b] border-[#71807a]/25",
  },
  cloning: {
    label: "Cloning",
    className: "bg-[#d5b875]/12 text-[#d8c38e] border-[#d5b875]/24",
  },
  cloned: {
    label: "Cloned",
    className: "bg-[#d5b875]/12 text-[#d8c38e] border-[#d5b875]/24",
  },
  building: {
    label: "Building",
    className: "bg-[#d5b875]/12 text-[#d8c38e] border-[#d5b875]/24",
  },
  deploying: {
    label: "Deploying",
    className: "bg-[#d5b875]/12 text-[#d8c38e] border-[#d5b875]/24",
  },
  live: {
    label: "Live",
    className: "bg-[#7ac7a5]/12 text-[#8fd4b7] border-[#7ac7a5]/24",
  },
  failed: {
    label: "Failed",
    className: "bg-[#d87970]/12 text-[#e18f87] border-[#d87970]/24",
  },
  rolled_back: {
    label: "Rolled Back",
    className: "bg-[#d87970]/12 text-[#e18f87] border-[#d87970]/24",
  },
  stopped: {
    label: "Stopped",
    className: "bg-[#71807a]/12 text-[#93a19b] border-[#71807a]/25",
  },
  deleted: {
    label: "Deleted",
    className: "bg-[#71807a]/12 text-[#93a19b] border-[#71807a]/25",
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
