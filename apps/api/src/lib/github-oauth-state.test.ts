import { afterEach, expect, test, vi } from "vitest";
const { values } = vi.hoisted(() => ({ values: new Map<string, string>() }));
vi.mock("@fleet/queue", () => ({ createRedisConnection: () => ({
  set: vi.fn(async (key: string, value: string) => { values.set(key, value); }),
  getdel: vi.fn(async (key: string) => { const value = values.get(key) ?? null; values.delete(key); return value; }),
  disconnect: vi.fn(),
}) }));
import { createInstallationState, consumeInstallationState, createOAuthState, consumeOAuthState, createLoginOAuthState, consumeLoginOAuthState } from "./github-oauth-state";
afterEach(() => values.clear());

test("installation state is single-use and cannot be used as an OAuth or login state", async () => {
  const state = await createInstallationState("user-1");
  await expect(consumeOAuthState(state)).resolves.toBeNull();
  await expect(consumeLoginOAuthState(state)).resolves.toBe(false);
  await expect(consumeInstallationState(state)).resolves.toBe("user-1");
  await expect(consumeInstallationState(state)).resolves.toBeNull();
});

test("login and OAuth states cannot be exchanged for installation state", async () => {
  const oauth = await createOAuthState("user-1");
  const login = await createLoginOAuthState();
  await expect(consumeInstallationState(oauth)).resolves.toBeNull();
  await expect(consumeInstallationState(login)).resolves.toBeNull();
  await expect(consumeOAuthState(oauth)).resolves.toBe("user-1");
  await expect(consumeLoginOAuthState(login)).resolves.toBe(true);
});
