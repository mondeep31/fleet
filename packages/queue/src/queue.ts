import { Queue } from "bullmq";
import { createRedisConnection } from "./connection";
import { DEPLOY_QUEUE, EMAIL_QUEUE } from "./names";
import type { DeployJobPayload, EmailJobPayload } from "./types";

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

let emailQueue: Queue<EmailJobPayload> | null = null;

export function createEmailQueue() {
  if (!emailQueue) {
    emailQueue = new Queue<EmailJobPayload>(EMAIL_QUEUE, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return emailQueue;
}

export async function enqueueEmail(payload: EmailJobPayload): Promise<void> {
  const queue = createEmailQueue();
  await queue.add("email", payload);
}

export async function cancelDeployJob(deploymentId: string): Promise<boolean> {
  const job = await createDeployQueue().getJob(deploymentId);
  if (!job) return false;

  const state = await job.getState();
  if (state === "waiting" || state === "delayed") {
    await job.remove();
    return true;
  }

  return false;
}
