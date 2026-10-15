import { afterEach, expect, test, vi } from "vitest";
const { values } = vi.hoisted(() => ({ values: new Map<string, string>() }));
vi.mock("@fleet/queue", () => ({ createRedisConnection: () => ({
  set: vi.fn(async (key: string, value: string) => { values.set(key, value); }),
  getdel: vi.fn(async (key: string) => { const value = values.get(key) ?? null; values.delete(key); return value; }),
  disconnect: vi.fn(),
}) }));
import { createInstallationState, consumeInstallationState, createOAuthState, consumeOAuthState, createLoginOAuthState, consumeLoginOAuthState, normalizeGitHubReturnTo } from "./github-oauth-state";
afterEach(() => values.clear());

test("installation state is single-use and cannot be used as an OAuth or login state", async () => {
  const state = await createInstallationState("user-1");
  await expect(consumeOAuthState(state)).resolves.toBeNull();
  await expect(consumeLoginOAuthState(state)).resolves.toBe(false);
  await expect(consumeInstallationState(state)).resolves.toEqual({ userId: "user-1", returnTo: "/connections" });
  await expect(consumeInstallationState(state)).resolves.toBeNull();
});

test("login and OAuth states cannot be exchanged for installation state", async () => {
  const oauth = await createOAuthState("user-1");
  const login = await createLoginOAuthState();
  await expect(consumeInstallationState(oauth)).resolves.toBeNull();
  await expect(consumeInstallationState(login)).resolves.toBeNull();
  await expect(consumeOAuthState(oauth)).resolves.toEqual({ userId: "user-1", returnTo: "/connections" });
  await expect(consumeLoginOAuthState(login)).resolves.toBe(true);
});

test("return pages survive both installation and authorization state consumption", async () => {
  const installation = await createInstallationState("user-1", "/projects/new");
  const context = await consumeInstallationState(installation);
  const oauth = await createOAuthState(context!.userId, context!.returnTo);
  await expect(consumeOAuthState(oauth)).resolves.toEqual({ userId: "user-1", returnTo: "/projects/new" });
});

test("external and protocol-relative return URLs cannot produce open redirects", () => {
  expect(normalizeGitHubReturnTo("https://evil.example")).toBe("/connections");
  expect(normalizeGitHubReturnTo("//evil.example")).toBe("/connections");
  expect(normalizeGitHubReturnTo(["/projects/new"])).toBe("/connections");
});

test("previously issued states containing a plain user ID still work", async () => {
  values.set("github:oauth:state:old-state", "legacy-user");
  await expect(consumeOAuthState("old-state")).resolves.toEqual({ userId: "legacy-user" });
});
