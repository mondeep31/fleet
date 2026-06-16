/**
 * Tests for the GitHub Dockerfile check logic in github-client.ts.
 *
 * HTTP is mocked via axios so no network is hit.
 */
import { describe, test, expect, vi, beforeEach } from "vitest";

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock("axios", async () => {
  const actual = await vi.importActual<typeof import("axios")>("axios");
  return {
    default: {
      ...actual.default,
      create: vi.fn(() => ({
        get: mockGet,
        request: vi.fn(),
        delete: vi.fn(),
      })),
      post: vi.fn(),
      isAxiosError: actual.default.isAxiosError,
    },
    isAxiosError: actual.isAxiosError,
  };
});

import { getRootDockerfile } from "../lib/github-client";

function mockAxiosGet(responses: Record<string, number>) {
  mockGet.mockImplementation(async (url: string) => {
    for (const [pattern, status] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return {
          status,
          statusText: status === 200 ? "OK" : "Not Found",
          data:
            status === 200
              ? { name: pattern, type: "file" }
              : { message: "Not Found" },
        };
      }
    }
    return {
      status: 404,
      statusText: "Not Found",
      data: { message: "Not Found" },
    };
  });
}

describe("getRootDockerfile", () => {
  const TOKEN = "fake-token";
  const OWNER = "acme";
  const REPO = "app";
  const BRANCH = "main";

  beforeEach(() => {
    mockGet.mockReset();
  });

  test("returns ok when Dockerfile exists", async () => {
    mockAxiosGet({ "contents/Dockerfile": 200 });
    const result = await getRootDockerfile(TOKEN, OWNER, REPO, BRANCH);
    expect(result).toEqual({
      ok: true,
      buildMethod: "dockerfile",
      dockerfilePath: "Dockerfile",
    });
  });

  test("falls back to lowercase dockerfile when Dockerfile is absent", async () => {
    mockGet.mockImplementation(async (url: string) => {
      if (url.includes("contents/dockerfile")) {
        return {
          status: 200,
          statusText: "OK",
          data: { name: "dockerfile" },
        };
      }
      return {
        status: 404,
        statusText: "Not Found",
        data: { message: "Not Found" },
      };
    });
    const result = await getRootDockerfile(TOKEN, OWNER, REPO, BRANCH);
    expect(result).toEqual({
      ok: true,
      buildMethod: "dockerfile",
      dockerfilePath: "dockerfile",
    });
  });

  test("Dockerfile wins over dockerfile when both exist", async () => {
    mockAxiosGet({ "contents/Dockerfile": 200, "contents/dockerfile": 200 });
    const result = await getRootDockerfile(TOKEN, OWNER, REPO, BRANCH);
    expect(result).toEqual({
      ok: true,
      buildMethod: "dockerfile",
      dockerfilePath: "Dockerfile",
    });
  });

  test("returns railpack fallback when neither file exists", async () => {
    mockAxiosGet({});
    const result = await getRootDockerfile(TOKEN, OWNER, REPO, BRANCH);
    expect(result).toEqual({ ok: true, buildMethod: "railpack" });
  });

  test("returns ok: false with API error message on unexpected status", async () => {
    mockGet.mockResolvedValue({
      status: 403,
      statusText: "Forbidden",
      data: { message: "rate limit exceeded" },
    });
    const result = await getRootDockerfile(TOKEN, OWNER, REPO, BRANCH);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/403/);
    }
  });
});
