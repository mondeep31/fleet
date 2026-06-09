import { z } from "zod";
import { config as loadDotenv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

loadDotenv({ path: resolve(repoRoot, ".env") });

const sharedEnvSchema = z.object({
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().min(1).default("redis://localhost:16379"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const apiEnvSchema = sharedEnvSchema.extend({
  JWT_SECRET: z.string().min(32),
  GITHUB_WEBHOOK_SECRET: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
  GITHUB_OAUTH_CALLBACK_URL: z
    .string()
    .url()
    .default("http://localhost:3010/v1/auth/github/callback"),
  GITHUB_OAUTH_SCOPES: z.string().default("read:user user:email repo"),
  AGENT_TOKEN: z.string().min(1),
  PORT: z.coerce.number().int().min(1).max(65535).default(3010),
  API_URL: z.string().min(1).default("http://localhost:3010"),
  DASHBOARD_URL: z.string().min(1).default("http://localhost:3000"),
});

export type SharedEnv = z.infer<typeof sharedEnvSchema>;
export type AppEnv = z.infer<typeof apiEnvSchema>;

let cachedSharedEnv: SharedEnv | null = null;
let cachedAppEnv: AppEnv | null = null;

function logEnvErrors(error: z.ZodError) {
  console.error("Invalid environment variables:");
  error.issues.forEach((issue) => {
    console.error(`   ${issue.path.join(".")}: ${issue.message}`);
  });
}

export function resetEnvCache(): void {
  cachedSharedEnv = null;
  cachedAppEnv = null;
}

export function getSharedEnv(): SharedEnv {
  if (!cachedSharedEnv) {
    const result = sharedEnvSchema.safeParse(process.env);
    if (!result.success) {
      logEnvErrors(result.error);
      process.exit(1);
    }
    cachedSharedEnv = result.data;
  }
  return cachedSharedEnv;
}

export function getEnv(): AppEnv {
  if (!cachedAppEnv) {
    const result = apiEnvSchema.safeParse(process.env);
    if (!result.success) {
      logEnvErrors(result.error);
      process.exit(1);
    }
    cachedAppEnv = result.data;
  }
  return cachedAppEnv;
}
