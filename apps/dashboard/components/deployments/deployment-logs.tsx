"use client";

import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  DeploymentLogLine,
  LogStreamState,
} from "@/hooks/use-deployment-log-stream";

export function DeploymentLogs({
  lines,
  streamState,
}: {
  lines: DeploymentLogLine[];
  streamState: LogStreamState;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottom = useRef(true);

  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 22,
    overscan: 20,
  });

  useEffect(() => {
    if (!shouldStickToBottom.current || lines.length === 0) return;
    virtualizer.scrollToIndex(lines.length - 1, { align: "end" });
  }, [lines.length, virtualizer]);

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

  if (streamState === "connecting" && lines.length === 0) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full max-w-xl" />
        ))}
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <p className="p-4 font-mono text-sm text-muted-foreground">
        {streamState === "unavailable"
          ? "Logs unavailable."
          : streamState === "ended"
            ? "No log output captured."
            : streamState === "live"
              ? "Connected. Waiting for log output…"
              : "Waiting for build output…"}
      </p>
    );
  }

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="h-[420px] overflow-auto bg-[#111c1a] p-4 font-mono text-xs leading-relaxed text-[#dbe5df] scrollbar-thin scrollbar-track-[#111c1a] scrollbar-thumb-[#52635d] scrollbar-corner-[#111c1a] scrollbar-hover:scrollbar-thumb-[#72847d]"
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
            {lines[virtualRow.index]?.line}
          </div>
        ))}
      </div>
    </div>
  );
}
