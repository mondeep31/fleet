"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/format";
import { isActiveStatus, type DeploymentStatus } from "@/lib/types";

export function DeployDuration({
  createdAt,
  updatedAt,
  status,
}: {
  createdAt?: string;
  updatedAt?: string;
  status: DeploymentStatus;
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isActiveStatus(status)) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [status]);

  const end = isActiveStatus(status) ? undefined : updatedAt;
  return (
    <span className="tabular-nums text-muted-foreground">
      {formatDuration(createdAt, end)}
    </span>
  );
}
