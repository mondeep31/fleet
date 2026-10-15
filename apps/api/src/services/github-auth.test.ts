/**
 * Tests for the GitHub OAuth login/signup service:
 * - Brand-new GitHub user gets a signup welcome email
 * - Returning GitHub user (found by githubId) gets a login notification email
 * - Existing email/password user linking GitHub gets a login notification email (not signup)
 * - Missing OAuth state throws INVALID_OAUTH_STATE
 * - Missing primary email throws NO_VERIFIED_EMAIL
 */
import { describe, test, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUserFindOne = vi.fn();
const mockUserCreate = vi.fn();
const mockEnqueueEmail = vi.fn();
const mockConsumeLoginOAuthState = vi.fn();
const mockCreateLoginOAuthState = vi.fn();
const mockExchangeCode = vi.fn();
const mockGetAuthenticatedUser = vi.fn();
const mockGetPrimaryEmail = vi.fn();
const mockWriteIntegration = vi.fn();
const mockSignJWT = vi.fn();

vi.mock("@fleet/db", () => ({
  Integration: { findOneAndUpdate: (...args: unknown[]) => mockWriteIntegration(...args) },
  User: {
    findOne: (...args: unknown[]) => mockUserFindOne(...args),
    create: (...args: unknown[]) => mockUserCreate(...args),
  },
}));

vi.mock("@fleet/auth", () => ({
  signJWT: (...args: unknown[]) => mockSignJWT(...args),
}));

vi.mock("@fleet/config", () => ({
  getEnv: () => ({
    GITHUB_LOGIN_CLIENT_ID: "client-id",
    GITHUB_LOGIN_CLIENT_SECRET: "client-secret",
    GITHUB_LOGIN_CALLBACK_URL: "https://example.com/callback",
  }),
}));

vi.mock("@fleet/errors", () => ({
  AppError: class extends Error {
    constructor(
      public status: number,
      message: string,
      public code: string,
    ) {
      super(message);
    }
  },
}));

vi.mock("@fleet/queue", () => ({
  enqueueEmail: (...args: unknown[]) => mockEnqueueEmail(...args),
}));

vi.mock("../lib/github-oauth-state", () => ({
  createLoginOAuthState: (...args: unknown[]) => mockCreateLoginOAuthState(...args),
  consumeLoginOAuthState: (...args: unknown[]) => mockConsumeLoginOAuthState(...args),
}));

vi.mock("../lib/github-client", () => ({
  exchangeCode: (...args: unknown[]) => mockExchangeCode(...args),
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
  getPrimaryEmail: (...args: unknown[]) => mockGetPrimaryEmail(...args),
}));

// ---------------------------------------------------------------------------
// Subject
// ---------------------------------------------------------------------------

import { getLoginRedirectUrl, handleLoginCallback } from "./github-auth";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const GH_USER = { id: 42, login: "octocat", name: "The Octocat" };
const PRIMARY_EMAIL = "octocat@github.com";
const EXISTING_USER = {
  userId: "user-1",
  name: "The Octocat",
  email: PRIMARY_EMAIL,
  githubId: "42",
  save: vi.fn().mockResolvedValue(undefined),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("login requests only profile and email access", async () => {
  mockCreateLoginOAuthState.mockResolvedValue("login-state");
  const url = new URL(await getLoginRedirectUrl());

  expect(url.searchParams.get("scope")?.split(" ")).toEqual([
    "read:user",
    "user:email",
  ]);
  expect(url.searchParams.get("client_id")).toBe("client-id");
  expect(url.searchParams.get("state")).toBe("login-state");
});

describe("handleLoginCallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsumeLoginOAuthState.mockResolvedValue(true);
    mockExchangeCode.mockResolvedValue("gh-access-token");
    mockGetAuthenticatedUser.mockResolvedValue(GH_USER);
    mockGetPrimaryEmail.mockResolvedValue(PRIMARY_EMAIL);
    mockSignJWT.mockReturnValue("jwt-token");
  });

  test("new GitHub user — enqueues signup email and returns JWT", async () => {
    mockUserFindOne.mockResolvedValue(null); // no user by githubId, no user by email
    mockUserCreate.mockResolvedValue({
      userId: "user-new",
      name: "The Octocat",
      email: PRIMARY_EMAIL,
    });

    const result = await handleLoginCallback("code-123", "state-abc");

    expect(mockUserCreate).toHaveBeenCalledWith({
      name: "The Octocat",
      email: PRIMARY_EMAIL,
      githubId: "42",
    });
    expect(mockEnqueueEmail).toHaveBeenCalledWith({
      type: "signup",
      to: PRIMARY_EMAIL,
      name: "The Octocat",
    });
    expect(result.token).toBe("jwt-token");
  });

  test("returning GitHub user — enqueues login email (not signup)", async () => {
    // First findOne (by githubId) returns existing user
    mockUserFindOne.mockResolvedValueOnce(EXISTING_USER);

    const result = await handleLoginCallback("code-123", "state-abc");

    expect(mockUserCreate).not.toHaveBeenCalled();
    expect(mockEnqueueEmail).toHaveBeenCalledWith({
      type: "login",
      to: PRIMARY_EMAIL,
      name: "The Octocat",
    });
    expect(result.userId).toBe("user-1");
  });

  test("signing in does not create or overwrite a repository connection", async () => {
    mockUserFindOne.mockResolvedValueOnce(EXISTING_USER);

    await handleLoginCallback("code-123", "state-abc");

    expect(mockWriteIntegration).not.toHaveBeenCalled();
  });

  test("existing email/password user linking GitHub — enqueues login email (not signup)", async () => {
    // First findOne (by githubId) returns null, second (by email) returns existing user
    mockUserFindOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...EXISTING_USER });

    const result = await handleLoginCallback("code-123", "state-abc");

    expect(mockUserCreate).not.toHaveBeenCalled();
    expect(mockEnqueueEmail).toHaveBeenCalledWith({
      type: "login",
      to: PRIMARY_EMAIL,
      name: "The Octocat",
    });
    expect(result.userId).toBe("user-1");
  });

  test("invalid OAuth state — throws INVALID_OAUTH_STATE before any user lookup", async () => {
    mockConsumeLoginOAuthState.mockResolvedValue(false);

    await expect(handleLoginCallback("code-123", "bad-state")).rejects.toMatchObject({
      status: 400,
      code: "INVALID_OAUTH_STATE",
    });
    expect(mockUserFindOne).not.toHaveBeenCalled();
    expect(mockEnqueueEmail).not.toHaveBeenCalled();
  });

  test("no verified GitHub email — throws NO_VERIFIED_EMAIL before any user lookup", async () => {
    mockGetPrimaryEmail.mockResolvedValue(null);

    await expect(handleLoginCallback("code-123", "state-abc")).rejects.toMatchObject({
      status: 400,
      code: "NO_VERIFIED_EMAIL",
    });
    expect(mockUserFindOne).not.toHaveBeenCalled();
    expect(mockEnqueueEmail).not.toHaveBeenCalled();
  });
});
