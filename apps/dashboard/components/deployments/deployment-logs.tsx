"use client";

import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Skeleton } from "@/components/ui/skeleton";

export function DeploymentLogs({
  logs,
  isLoading,
}: {
  logs: string[];
  isLoading: boolean;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottom = useRef(true);

  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 22,
    overscan: 20,
  });

  useEffect(() => {
    if (!shouldStickToBottom.current || logs.length === 0) return;
    virtualizer.scrollToIndex(logs.length - 1, { align: "end" });
  }, [logs.length, virtualizer]);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    function handleScroll() {
      const distanceFromBottom =
        el!.scrollHeight - el!.scrollTop - el!.clientHeight;
      shouldStickToBottom.current = distanceFromBottom < 48;
    }

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading && logs.length === 0) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full max-w-xl" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="p-4 font-mono text-sm text-muted-foreground">
        Waiting for build output…
      </p>
    );
  }

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="h-[420px] overflow-auto bg-[var(--bg-inset)] p-4 font-mono text-xs leading-relaxed text-[#e4e0d8]"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
          width: "100%",
        }}
      >
        {items.map((virtualRow) => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start}px)`,
            }}
            className="whitespace-pre-wrap break-all"
          >
            {logs[virtualRow.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
