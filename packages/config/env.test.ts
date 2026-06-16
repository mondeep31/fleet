import { afterEach, describe, expect, test } from "vitest";
import { getEnv, getSharedEnv, resetEnvCache } from "./env";

import { randomBytes } from "node:crypto";

const REQUIRED_ENV = {
  MONGODB_URI: "mongodb://localhost:27017/fleet",
  JWT_SECRET: "a".repeat(32),
  GITHUB_WEBHOOK_SECRET: "github-secret",
  AGENT_TOKEN: "agent-token",
  FLEET_SECRETS_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
  GITHUB_CLIENT_ID: "test-client-id",
  GITHUB_CLIENT_SECRET: "test-client-secret",
  GITHUB_OAUTH_CALLBACK_URL: "http://localhost:3010/api/v1/integrations/github/callback",
  GITHUB_OAUTH_SUCCESS_REDIRECT: "http://localhost:3000/projects",
  RESEND_API_KEY: "re_test_key",
  RESEND_FROM_EMAIL: "Fleet <onboarding@resend.dev>",
  DASHBOARD_URL: "http://localhost:3000",
} as const;

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_EXIT = process.exit;
const ORIGINAL_ERROR = console.error;

const resetProcessEnv = () => {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  Object.assign(process.env, ORIGINAL_ENV);
};

afterEach(() => {
  process.exit = ORIGINAL_EXIT;
  console.error = ORIGINAL_ERROR;
  resetEnvCache();
  resetProcessEnv();
});

describe("getEnv", () => {
  test("returns parsed env with defaults and coercion", () => {
    resetProcessEnv();
    Reflect.deleteProperty(process.env, "NODE_ENV");
    Object.assign(process.env, REQUIRED_ENV, { PORT: "4321" });
    const env = getEnv();

    expect(env.MONGODB_URI).toBe(REQUIRED_ENV.MONGODB_URI);
    expect(env.REDIS_URL).toBe("redis://localhost:16379");
    expect(env.JWT_SECRET).toBe(REQUIRED_ENV.JWT_SECRET);
    expect(env.GITHUB_WEBHOOK_SECRET).toBe(REQUIRED_ENV.GITHUB_WEBHOOK_SECRET);
    expect(env.AGENT_TOKEN).toBe(REQUIRED_ENV.AGENT_TOKEN);
    expect(env.PORT).toBe(4321);
    expect(env.API_URL).toBe("http://localhost:3010");
    expect(env.NODE_ENV).toBe("development");
  });

  test("uses cached env on subsequent calls", () => {
    resetProcessEnv();
    Object.assign(process.env, REQUIRED_ENV, { PORT: "5000" });
    const first = getEnv();

    process.env.JWT_SECRET = "short";
    process.env.PORT = "9999";
    const second = getEnv();

    expect(second).toBe(first);
    expect(second.PORT).toBe(5000);
    expect(second.JWT_SECRET).toBe(REQUIRED_ENV.JWT_SECRET);
  });

  test("logs issues and exits on invalid env", () => {
    resetProcessEnv();
    Object.assign(process.env, REQUIRED_ENV);
    delete process.env.MONGODB_URI;

    const logged: string[] = [];
    console.error = (...args: unknown[]) => {
      logged.push(args.join(" "));
    };
    process.exit = ((code?: number) => {
      throw new Error(`EXIT_${code ?? 0}`);
    }) as typeof process.exit;

    expect(() => getEnv()).toThrow("EXIT_1");
    expect(
      logged.some((line) => line.includes("Invalid environment variables")),
    ).toBe(true);
    expect(logged.some((line) => line.includes("MONGODB_URI"))).toBe(true);
  });
});

describe("getSharedEnv", () => {
  test("returns shared vars without API-only fields", () => {
    resetProcessEnv();
    Reflect.deleteProperty(process.env, "NODE_ENV");
    Object.assign(process.env, {
      MONGODB_URI: REQUIRED_ENV.MONGODB_URI,
      FLEET_SECRETS_ENCRYPTION_KEY: REQUIRED_ENV.FLEET_SECRETS_ENCRYPTION_KEY,
      RESEND_API_KEY: REQUIRED_ENV.RESEND_API_KEY,
    });
    const env = getSharedEnv();

    expect(env.MONGODB_URI).toBe(REQUIRED_ENV.MONGODB_URI);
    expect(env.REDIS_URL).toBe("redis://localhost:16379");
    expect(env.NODE_ENV).toBe("development");
    expect(env.RESEND_API_KEY).toBe(REQUIRED_ENV.RESEND_API_KEY);
    expect(env.DASHBOARD_URL).toBe("http://localhost:3000");
  });

  test("exits when MONGODB_URI is missing", () => {
    resetProcessEnv();
    delete process.env.MONGODB_URI;
    Object.assign(process.env, {
      FLEET_SECRETS_ENCRYPTION_KEY: REQUIRED_ENV.FLEET_SECRETS_ENCRYPTION_KEY,
      RESEND_API_KEY: REQUIRED_ENV.RESEND_API_KEY,
    });

    process.exit = ((code?: number) => {
      throw new Error(`EXIT_${code ?? 0}`);
    }) as typeof process.exit;

    expect(() => getSharedEnv()).toThrow("EXIT_1");
  });
});
