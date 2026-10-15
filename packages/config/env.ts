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
  FLEET_APPS_DOMAIN: z.string().min(1).default("localhost"),
  FLEET_PUBLIC_URL_SCHEME: z.enum(["http", "https"]).default("http"),
  FLEET_TRAEFIK_PUBLIC_PORT: z
    .string()
    .transform((value) => value.trim())
    .optional(),
  FLEET_TRAEFIK_NETWORK: z.string().min(1).default("fleet-proxy"),
  // Docker container name of the Traefik reverse proxy (must match docker-compose).
  FLEET_TRAEFIK_CONTAINER: z.string().min(1).default("fleet-traefik"),
  // Host directory bind-mounted into Traefik's file provider (see docker-compose.yml)
  // for custom-domain routing. Must resolve to the same path Traefik sees at /dynamic.
  FLEET_TRAEFIK_DYNAMIC_DIR: z.string().min(1).default("/tmp/fleet-traefik-dynamic"),
  // Cloudflare for SaaS — custom hostnames for user-connected custom domains.
  // Optional: only required to use the custom domain feature. Token needs
  // Zone:SSL and Certificates:Edit + Zone:Custom Hostnames:Edit on the zone below.
  // Shared (not API-only) because the worker's domain-verification sweep needs it too.
  CLOUDFLARE_API_TOKEN: z.string().min(1).optional(),
  CLOUDFLARE_ZONE_ID: z.string().min(1).optional(),
  // Optional JSON map of plan → compute limits; merges over packages/config/plans defaults.
  // Example: {"pro":{"memoryMb":2048,"nanoCpus":2000000000,"pidsLimit":512,"tmpfsMb":128}}
  FLEET_PLAN_LIMITS_JSON: z.string().optional(),
  // Base64-encoded 32-byte key used to encrypt project env vars at rest.
  // Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  FLEET_SECRETS_ENCRYPTION_KEY: z.string().min(44),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().min(1).default("Fleet <onboarding@resend.dev>"),
  DASHBOARD_URL: z.string().url().default("http://localhost:3000"),
  // Shared with the worker so expiring GitHub App user tokens can be refreshed.
  GITHUB_APP_CLIENT_ID: z.string().optional(),
  GITHUB_APP_CLIENT_SECRET: z.string().optional(),
});

const apiEnvSchema = sharedEnvSchema.extend({
  JWT_SECRET: z.string().min(32),
  GITHUB_WEBHOOK_SECRET: z.string().min(1),
  AGENT_TOKEN: z.string().min(1),
  PORT: z.coerce.number().int().min(1).max(65535).default(3010),
  API_URL: z.string().min(1).default("http://localhost:3010"),
  // Legacy repository OAuth credentials, retained only for disconnecting old grants.
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_OAUTH_SUCCESS_REDIRECT: z.string().url(),
  GITHUB_APP_SLUG: z.string().regex(/^[a-zA-Z0-9-]+$/).optional(),
  GITHUB_APP_CALLBACK_URL: z.string().url().optional(),
  // GitHub OAuth App credentials for login/signup.
  GITHUB_LOGIN_CLIENT_ID: z.string().min(1),
  GITHUB_LOGIN_CLIENT_SECRET: z.string().min(1),
  GITHUB_LOGIN_CALLBACK_URL: z.string().url(),
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
