"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/format";

function getTickInterval(date: string | Date): number {
  const ageMs = Date.now() - new Date(date).getTime();
  if (ageMs < 60_000) return 1_000;          // < 1 min: tick every second
  if (ageMs < 3_600_000) return 60_000;      // < 1 hour: tick every minute
  if (ageMs < 86_400_000) return 3_600_000;  // < 24 hours: tick every hour
  return 86_400_000;                          // >= 24 hours: tick every day
}

export function RelativeTime({
  date,
  className,
}: {
  date: string | Date | undefined;
  className?: string;
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!date) return;

    const schedule = () => {
      const interval = getTickInterval(date);
      const id = window.setTimeout(() => {
        setTick((n) => n + 1);
        schedule();
      }, interval);
      return id;
    };

    const id = schedule();
    return () => window.clearTimeout(id);
  }, [date]);

  const title = date
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(date))
    : undefined;

  return (
    <span className={className} title={title}>
      {formatRelativeTime(date)}
    </span>
  );
}
