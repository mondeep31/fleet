/// <reference path="../../../packages/auth/src/express.d.ts" />
import { getEnv } from "@fleet/config";
import express from "express";
import type { RequestHandler } from "express";
import { connectDB, disconnectDB } from "@fleet/db";
import { errorHandler, notFoundHandler } from "@fleet/api-middleware";
import { authMiddleware } from "@fleet/auth";
import router from "./routes";
import unauthRoutes from "./routes/unauth";

const { PORT } = getEnv();

const app = express();

const ping: RequestHandler = (_, res) => {
  res.json({ message: "pong" });
};

app.use(express.json());
app.get("/health", (_, res) => {
  res.json({ message: "OK" });
});
app.get("/ping", ping);
app.use("/v1", unauthRoutes);
app.use("/api/v1", authMiddleware, router);
app.use(notFoundHandler);
app.use(errorHandler);

async function main() {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await disconnectDB();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
