import { getSharedEnv } from "@fleet/config";
import { Worker } from "bullmq";
import { connectDB, disconnectDB } from "@fleet/db";
import {
  createRedisConnection,
  DEPLOY_QUEUE,
  EMAIL_QUEUE,
  type DeployJobPayload,
  type EmailJobPayload,
} from "@fleet/queue";
import { handleDeployJob } from "./jobs/deploy";
import { handleEmailJob } from "./jobs/email";

getSharedEnv();

const connection = createRedisConnection();

await connectDB();

const deployWorker = new Worker<DeployJobPayload>(
  DEPLOY_QUEUE,
  async (job) => {
    await handleDeployJob(job.data);
  },
  { connection },
);

const emailWorker = new Worker<EmailJobPayload>(
  EMAIL_QUEUE,
  async (job) => {
    await handleEmailJob(job.data);
  },
  { connection },
);

deployWorker.on("failed", (job, err) => {
  console.error(`deploy job ${job?.id} failed:`, err);
});

emailWorker.on("failed", (job, err) => {
  console.error(`email job ${job?.id} failed:`, err);
});

const shutdown = async () => {
  console.log("shutting down worker...");
  await deployWorker.close();
  await emailWorker.close();
  await connection.quit();
  await disconnectDB();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log(`worker listening on queues "${DEPLOY_QUEUE}", "${EMAIL_QUEUE}"`);
