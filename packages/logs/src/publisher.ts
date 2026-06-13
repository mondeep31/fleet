import { createRedisConnection } from "@fleet/queue";
import { writeLogEntries } from "./store";
import type { DeploymentLogEntry, DeploymentLogSource } from "./types";

const FLUSH_INTERVAL_MS = 250;

export class BatchedDeploymentLogPublisher {
  private readonly connection = createRedisConnection();
  private readonly buffers = new Map<string, DeploymentLogEntry[]>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  append(
    deploymentId: string,
    batch: string[],
    source: DeploymentLogSource,
  ): void {
    const entries = batch
      .filter((line) => line.length > 0)
      .map((line) => ({ line, source }));

    if (entries.length === 0) return;

    const existing = this.buffers.get(deploymentId) ?? [];
    this.buffers.set(deploymentId, existing.concat(entries));

    if (!this.timers.has(deploymentId)) {
      this.timers.set(
        deploymentId,
        setTimeout(() => {
          void this.flush(deploymentId);
        }, FLUSH_INTERVAL_MS),
      );
    }
  }

  async flush(deploymentId: string): Promise<void> {
    const timer = this.timers.get(deploymentId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(deploymentId);
    }

    const entries = this.buffers.get(deploymentId) ?? [];
    if (entries.length === 0) return;

    this.buffers.set(deploymentId, []);
    await writeLogEntries(this.connection, deploymentId, entries);
  }
}
