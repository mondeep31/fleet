import { beforeEach, describe, expect, test, vi } from "vitest";
const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("axios", async () => {
  const actual = await vi.importActual<typeof import("axios")>("axios");
  return { ...actual, default: { ...actual.default, create: () => ({ request }) } };
});
import { listAppRepos } from "./github-client";

const repo = (id: number, name: string, updated_at = "2026-01-01") => ({ id, name, full_name: `acme/${name}`, updated_at });
beforeEach(() => vi.resetAllMocks());

describe("GitHub App repository listing", () => {
  test("uses only authorized installations and selected repositories", async () => {
    request.mockResolvedValueOnce({ data: { installations: [{ id: 10 }, { id: 20 }] } })
      .mockResolvedValueOnce({ data: { repositories: [repo(1, "older")] } })
      .mockResolvedValueOnce({ data: { repositories: [repo(2, "newer", "2026-10-01")] } });
    const repos = await listAppRepos("token");
    expect(repos.map((r) => r.id)).toEqual([2, 1]);
    expect(request.mock.calls.map(([config]) => config.url)).toEqual([
      "/user/installations?per_page=100&page=1",
      "/user/installations/10/repositories?per_page=100&page=1",
      "/user/installations/20/repositories?per_page=100&page=1",
    ]);
  });

  test("search filters selected repositories before pagination", async () => {
    request.mockResolvedValueOnce({ data: { installations: [{ id: 10 }] } })
      .mockResolvedValueOnce({ data: { repositories: [repo(1, "api-a"), repo(2, "website"), repo(3, "api-b")] } });
    expect((await listAppRepos("token", 2, 1, "API")).map((r) => r.id)).toEqual([3]);
  });

  test("fetches additional repository pages rather than hiding results after 100", async () => {
    request.mockResolvedValueOnce({ data: { installations: [{ id: 10 }] } })
      .mockResolvedValueOnce({ data: { repositories: Array.from({ length: 100 }, (_, i) => repo(i, `other-${i}`)) } })
      .mockResolvedValueOnce({ data: { repositories: [repo(101, "target")] } });
    expect((await listAppRepos("token", 1, 30, "target")).map((r) => r.id)).toEqual([101]);
    expect(request.mock.calls[2]![0].url).toContain("page=2");
  });

  test("suspended installations are excluded", async () => {
    request.mockResolvedValueOnce({ data: { installations: [{ id: 10, suspended_at: "2026-01-01" }] } });
    await expect(listAppRepos("token")).resolves.toEqual([]);
    expect(request).toHaveBeenCalledTimes(1);
  });
});
