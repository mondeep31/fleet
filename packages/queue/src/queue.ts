import { Queue } from "bullmq";
import { createRedisConnection } from "./connection";
import { DEPLOY_QUEUE } from "./names";
import type { DeployJobPayload } from "./types";

let deployQueue: Queue<DeployJobPayload> | null = null;

export function createDeployQueue() {
  if (!deployQueue) {
    deployQueue = new Queue<DeployJobPayload>(DEPLOY_QUEUE, {
      connection: createRedisConnection(),
    });
  }
  return deployQueue;
}

export async function enqueueDeploy(payload: DeployJobPayload) {
  const queue = createDeployQueue();
  await queue.add("deploy", payload, {
    jobId: payload.deploymentId,
  });
}
