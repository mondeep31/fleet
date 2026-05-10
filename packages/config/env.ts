import { z } from "zod";
import { config as loadDotenv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

loadDotenv({ path: resolve(repoRoot, ".env") });

const envSchema = z.object({
  // MongoDB
  MONGODB_URI: z.string().min(1),

  // Redis
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),

  // Auth
  JWT_SECRET: z.string().min(32),

  // GitHub
  GITHUB_WEBHOOK_SECRET: z.string().min(1),

  // Agent
  AGENT_TOKEN: z.string().min(1),

  // API
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  API_URL: z.string().min(1).default("http://localhost:3000"),

  // Node
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function resetEnvCache(): void {
  cachedEnv = null;
}

export function getEnv(): AppEnv {
  if (!cachedEnv) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error("Invalid environment variables:");
      result.error.issues.forEach((issue) => {
        console.error(`   ${issue.path.join(".")}: ${issue.message}`);
      });
      process.exit(1);
    }
    cachedEnv = result.data;
  }
  return cachedEnv;
}
