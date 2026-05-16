import express from "express";
import type { RequestHandler } from "express";
import router from "./routes";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found-handler";
import { connectDB, disconnectDB } from "./db/config";

const app = express();
const port = process.env.PORT || 3001;

const ping: RequestHandler = (_, res) => {
  res.json({ message: "pong" });
};

app.use(express.json());
app.get("/ping", ping);
app.use("/api/v1", router);
app.use(notFoundHandler);
app.use(errorHandler);

async function main() {
  await connectDB();
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
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
