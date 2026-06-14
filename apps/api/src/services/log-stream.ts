import type { Response } from "express";
import { Deployment } from "@fleet/db";
import {
  deploymentLogsExist,
  readDeploymentLogs,
  subscribeDeploymentLogs,
  type DeploymentLogSource,
} from "@fleet/logs";
import { assertDeploymentOwnership } from "./deployment";
import { tailContainerLogs } from "./container-logs";

const IN_PROGRESS_STATUSES = new Set([
  "queued",
  "cloning",
  "cloned",
  "building",
  "deploying",
]);

const REPLAY_ONLY_STATUSES = new Set(["deleted", "stopped", "rolled_back"]);

interface SseLogPayload {
  line: string;
  source: DeploymentLogSource;
}

function flushSse(res: Response) {
  const response = res as Response & { flush?: () => void };
  response.flush?.();
}

function writeSseData(res: Response, payload: SseLogPayload | Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
  flushSse(res);
}

function writeSseEvent(res: Response, event: string, payload?: Record<string, unknown>) {
  res.write(`event: ${event}\n`);
  if (payload) {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  } else {
    res.write("\n");
  }
  flushSse(res);
}

async function getDeploymentStatus(deploymentId: string): Promise<string | null> {
  const deployment = await Deployment.findOne({ deploymentId }).select("status").lean();
  return deployment?.status ?? null;
}

async function replayRedisLogs(
  deploymentId: string,
  res: Response,
): Promise<number> {
  const entries = await readDeploymentLogs(deploymentId);
  for (const entry of entries) {
    writeSseData(res, { line: entry.line, source: entry.source });
  }
  return entries.length;
}

async function followRedisLogs(
  deploymentId: string,
  res: Response,
  signal: AbortSignal,
): Promise<string | null> {
  const pollAbort = new AbortController();
  signal.addEventListener("abort", () => pollAbort.abort());

  const poll = setInterval(async () => {
    const status = await getDeploymentStatus(deploymentId);
    if (
      status === "live" ||
      status === "failed" ||
      status === "deleted" ||
      status === "stopped" ||
      status === "rolled_back"
    ) {
      pollAbort.abort();
    }
  }, 2000);

  try {
    for await (const entry of subscribeDeploymentLogs(
      deploymentId,
      "0-0",
      pollAbort.signal,
    )) {
      if (signal.aborted) break;
      writeSseData(res, { line: entry.line, source: entry.source });
    }
  } catch {
    // aborted when status changed
  } finally {
    clearInterval(poll);
  }

  return getDeploymentStatus(deploymentId);
}

async function followDockerLogs(
  projectId: string,
  containerId: string | null | undefined,
  res: Response,
  signal: AbortSignal,
): Promise<void> {
  writeSseData(res, {
    line: "Tailing application output…",
    source: "pipeline",
  });

  try {
    for await (const line of tailContainerLogs({ projectId, containerId }, signal)) {
      if (signal.aborted) break;
      writeSseData(res, { line, source: "runtime" });
    }
  } catch {
    writeSseData(res, {
      line: "Application logs unavailable (container may have stopped).",
      source: "pipeline",
    });
  }
}

export async function streamDeploymentLogs(
  deploymentId: string,
  userId: string,
  res: Response,
  signal: AbortSignal,
): Promise<void> {
  const deployment = await assertDeploymentOwnership(deploymentId, userId);
  const { status, error, projectId, containerId } = deployment;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  if (REPLAY_ONLY_STATUSES.has(status)) {
    if (await deploymentLogsExist(deploymentId)) {
      await replayRedisLogs(deploymentId, res);
    } else {
      writeSseData(res, {
        line: error
          ? `Build logs expired (24h retention). Error: ${error}`
          : "Build logs expired (24h retention).",
        source: "pipeline",
      });
    }
    writeSseEvent(res, "end");
    res.end();
    return;
  }

  if (status === "failed") {
    await replayRedisLogs(deploymentId, res);
    writeSseEvent(res, "end");
    res.end();
    return;
  }

  if (status === "live") {
    const replayed = await replayRedisLogs(deploymentId, res);
    if (replayed === 0) {
      writeSseData(res, {
        line: "Build logs unavailable. Tailing runtime output…",
        source: "pipeline",
      });
    }
    if (signal.aborted) {
      res.end();
      return;
    }
    await followDockerLogs(projectId, containerId, res, signal);
    writeSseEvent(res, "end");
    res.end();
    return;
  }

  if (IN_PROGRESS_STATUSES.has(status)) {
    const lastStatus = await followRedisLogs(deploymentId, res, signal);
    if (!signal.aborted && lastStatus === "live") {
      const liveDeployment = await Deployment.findOne({ deploymentId })
        .select("containerId")
        .lean();
      await followDockerLogs(
        projectId,
        liveDeployment?.containerId,
        res,
        signal,
      );
    }
    writeSseEvent(res, "end");
    res.end();
    return;
  }

  writeSseData(res, {
    line: "No logs available for this deployment.",
    source: "pipeline",
  });
  writeSseEvent(res, "end");
  res.end();
}
