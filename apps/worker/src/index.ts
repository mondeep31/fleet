import { config as loadDotenv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "bullmq";
import {
  createRedisConnection,
  DEPLOY_QUEUE,
  type DeployJobPayload,
} from "@fleet/queue";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
loadDotenv({ path: resolve(repoRoot, ".env") });

const connection = createRedisConnection();

const worker = new Worker<DeployJobPayload>(
  DEPLOY_QUEUE,
  async (job) => {
    console.log("got job", job.data);
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
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log(`worker listening on queue "${DEPLOY_QUEUE}"`);
