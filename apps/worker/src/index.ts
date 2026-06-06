import { getSharedEnv } from "@fleet/config";
import { Worker } from "bullmq";
import { connectDB, disconnectDB } from "@fleet/db";
import {
  createRedisConnection,
  DEPLOY_QUEUE,
  type DeployJobPayload,
} from "@fleet/queue";
import { handleDeployJob } from "./jobs/deploy";

getSharedEnv();

const connection = createRedisConnection();

await connectDB();

const worker = new Worker<DeployJobPayload>(
  DEPLOY_QUEUE,
  async (job) => {
    await handleDeployJob(job.data);
  },
  { connection },
);

worker.on("failed", (job, err) => {
  console.error(`job ${job?.id} failed:`, err);
});

const shutdown = async () => {
  console.log("shutting down worker...");
  await worker.close();
  await connection.quit();
  await disconnectDB();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log(`worker listening on queue "${DEPLOY_QUEUE}"`);
