import { getSharedEnv } from "@fleet/config";
import { Worker } from "bullmq";
import { connectDB, disconnectDB } from "@fleet/db";
import {
  createDomainVerifyQueue,
  createRedisConnection,
  DEPLOY_QUEUE,
  DOMAIN_VERIFY_QUEUE,
  EMAIL_QUEUE,
  type DeployJobPayload,
  type EmailJobPayload,
} from "@fleet/queue";
import { handleDeployJob } from "./jobs/deploy";
import { handleEmailJob } from "./jobs/email";
import { handleDomainVerifySweep } from "./jobs/domain-verify";

getSharedEnv();

const connection = createRedisConnection();

await connectDB();

const deployWorker = new Worker<DeployJobPayload>(
  DEPLOY_QUEUE,
  async (job) => {
    await handleDeployJob(job.data);
  },
  {
    connection,
    lockDuration: 5 * 60 * 1000,
    stalledInterval: 30 * 1000,
    maxStalledCount: 2,
  },
);

const emailWorker = new Worker<EmailJobPayload>(
  EMAIL_QUEUE,
  async (job) => {
    await handleEmailJob(job.data);
  },
  { connection },
);

const domainVerifyWorker = new Worker(
  DOMAIN_VERIFY_QUEUE,
  async () => {
    await handleDomainVerifySweep();
  },
  { connection },
);

// Idempotent — safe to call on every boot, won't create duplicate schedulers.
await createDomainVerifyQueue().upsertJobScheduler(
  "domain-verify-sweep",
  { every: 30_000 },
  { name: "sweep" },
);

deployWorker.on("failed", (job, err) => {
  console.error(`deploy job ${job?.id} failed:`, err);
});

emailWorker.on("failed", (job, err) => {
  console.error(`email job ${job?.id} failed:`, err);
});

domainVerifyWorker.on("failed", (job, err) => {
  console.error(`domain-verify job ${job?.id} failed:`, err);
});

const shutdown = async () => {
  console.log("shutting down worker...");
  await deployWorker.close();
  await emailWorker.close();
  await domainVerifyWorker.close();
  await connection.quit();
  await disconnectDB();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log(
  `worker listening on queues "${DEPLOY_QUEUE}", "${EMAIL_QUEUE}", "${DOMAIN_VERIFY_QUEUE}"`,
);
