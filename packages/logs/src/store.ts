import type IORedis from "ioredis";
import { createRedisConnection } from "@fleet/queue";
import { DEPLOYMENT_LOG_TTL_SECONDS, deploymentLogsStreamKey } from "./keys";
import { parseLogFields } from "./parse";
import type { DeploymentLogEntry } from "./types";

async function writeLogEntries(
  connection: IORedis,
  deploymentId: string,
  entries: DeploymentLogEntry[],
): Promise<void> {
  if (entries.length === 0) return;

  const key = deploymentLogsStreamKey(deploymentId);
  const pipeline = connection.pipeline();

  for (const entry of entries) {
    pipeline.xadd(key, "*", "line", entry.line, "source", entry.source);
  }

  pipeline.expire(key, DEPLOYMENT_LOG_TTL_SECONDS);
  await pipeline.exec();
}

export async function deploymentLogsExist(deploymentId: string): Promise<boolean> {
  const connection = createRedisConnection();
  try {
    const length = await connection.xlen(deploymentLogsStreamKey(deploymentId));
    return length > 0;
  } finally {
    connection.disconnect();
  }
}

export async function readDeploymentLogs(
  deploymentId: string,
): Promise<DeploymentLogEntry[]> {
  const connection = createRedisConnection();
  const key = deploymentLogsStreamKey(deploymentId);

  try {
    const rows = await connection.xrange(key, "-", "+");
    const entries: DeploymentLogEntry[] = [];

    for (const [, fields] of rows) {
      const entry = parseLogFields(fields);
      if (entry) entries.push(entry);
    }

    return entries;
  } finally {
    connection.disconnect();
  }
}

export async function expireDeploymentLogs(deploymentId: string): Promise<void> {
  const connection = createRedisConnection();
  try {
    await connection.expire(
      deploymentLogsStreamKey(deploymentId),
      DEPLOYMENT_LOG_TTL_SECONDS,
    );
  } finally {
    connection.disconnect();
  }
}

export async function* subscribeDeploymentLogs(
  deploymentId: string,
  startId: string,
  signal: AbortSignal,
): AsyncGenerator<DeploymentLogEntry> {
  const connection = createRedisConnection();
  const key = deploymentLogsStreamKey(deploymentId);
  let lastId = startId;

  try {
    while (!signal.aborted) {
      const result = await connection.xread(
        "BLOCK",
        signal.aborted ? 100 : 5000,
        "STREAMS",
        key,
        lastId,
      );

      if (signal.aborted) break;
      if (!result) continue;

      for (const [, messages] of result) {
        for (const [id, fields] of messages) {
          lastId = id;
          const entry = parseLogFields(fields);
          if (entry) yield entry;
        }
      }
    }
  } finally {
    connection.disconnect();
  }
}

export { writeLogEntries };
