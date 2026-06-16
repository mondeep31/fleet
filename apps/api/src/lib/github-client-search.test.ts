import { describe, expect, it } from "vitest";
import { repoMatchesQuery, type GitHubRepo } from "./github-client";

const baseRepo: GitHubRepo = {
  id: 1,
  name: "astha-app",
  full_name: "alice/astha-app",
  owner: { login: "alice", type: "User" },
  private: false,
  description: null,
  default_branch: "main",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("repoMatchesQuery", () => {
  it("matches repo name substring", () => {
    expect(repoMatchesQuery(baseRepo, "astha")).toBe(true);
  });

  it("matches full_name substring", () => {
    expect(repoMatchesQuery(baseRepo, "alice/astha")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(repoMatchesQuery(baseRepo, "ASTHA")).toBe(true);
  });

  it("rejects unrelated queries", () => {
    expect(repoMatchesQuery(baseRepo, "fleet")).toBe(false);
  });

  it("trims whitespace in the query", () => {
    expect(repoMatchesQuery(baseRepo, "  astha  ")).toBe(true);
  });
});
