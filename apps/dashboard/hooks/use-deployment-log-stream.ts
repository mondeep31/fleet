"use client";

import { useEffect, useRef, useState } from "react";
import { getToken } from "@/lib/auth";
import type { DeploymentStatus } from "@/lib/types";

const API_BASE = "/api";

export type DeploymentLogLine = {
  line: string;
  source: "build" | "pipeline" | "runtime";
};

export type LogStreamState =
  | "connecting"
  | "live"
  | "ended"
  | "unavailable";

function parseSseChunk(
  chunk: string,
  onLine: (line: DeploymentLogLine) => void,
  onEnd: () => void,
) {
  const events = chunk.split("\n\n").filter(Boolean);

  for (const event of events) {
    if (event.startsWith("event: end")) {
      onEnd();
      continue;
    }

    const dataLine = event.split("\n").find((line) => line.startsWith("data: "));
    if (!dataLine) continue;

    try {
      const payload = JSON.parse(dataLine.slice(6)) as DeploymentLogLine;
      if (payload.line) onLine(payload);
    } catch {
      // ignore malformed events
    }
  }
}

function shouldReconnect(status: DeploymentStatus | undefined): boolean {
  if (!status) return false;
  if (status === "live") return true;
  return !(
    status === "failed" ||
    status === "deleted" ||
    status === "stopped" ||
    status === "rolled_back"
  );
}

export function useDeploymentLogStream(
  deploymentId: string | undefined,
  status: DeploymentStatus | undefined,
) {
  const [lines, setLines] = useState<DeploymentLogLine[]>([]);
  const [streamState, setStreamState] = useState<LogStreamState>("connecting");
  const reconnectAttempt = useRef(0);
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!deploymentId) return;

    setLines([]);
    const abortController = new AbortController();
    let buffer = "";
    let ended = false;

    async function connect() {
      const token = getToken();
      if (!token) {
        setStreamState("unavailable");
        return;
      }

      setStreamState("connecting");

      try {
        const response = await fetch(
          `${API_BASE}/deployments/${deploymentId}/logs/stream`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: abortController.signal,
          },
        );

        if (!response.ok || !response.body) {
          setStreamState("unavailable");
          return;
        }

        setStreamState("live");
        reconnectAttempt.current = 0;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (!ended && !abortController.signal.aborted) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            parseSseChunk(
              part,
              (line) => {
                setLines((current) => [...current, line]);
              },
              () => {
                ended = true;
              },
            );
          }
        }

        setStreamState("ended");
      } catch {
        if (abortController.signal.aborted) return;

        if (shouldReconnect(statusRef.current) && reconnectAttempt.current < 5) {
          const delay = Math.min(1000 * 2 ** reconnectAttempt.current, 10_000);
          reconnectAttempt.current += 1;
          setStreamState("connecting");
          await new Promise((resolve) => setTimeout(resolve, delay));
          if (!abortController.signal.aborted) {
            await connect();
          }
          return;
        }

        setStreamState("unavailable");
      }
    }

    void connect();

    return () => {
      abortController.abort();
    };
  }, [deploymentId]);

  return { lines, streamState };
}
