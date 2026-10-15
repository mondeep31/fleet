import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("./urls", () => ({
  apiInternalUrl: (path: string) => `http://api.internal${path}`,
  dashboardUrl: (path: string) => new URL(path, "https://fleet.example.com"),
}));
import { redirectToGitHub } from "./github-redirect";
const mockFetch = vi.fn();
beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal("fetch", mockFetch); });
afterEach(() => vi.unstubAllGlobals());

function request(cookie?: string) {
  return new NextRequest("https://fleet.example.com/api/integrations/github/authorize", { headers: cookie ? { Cookie: cookie } : {} });
}

test("an unsigned installation return asks the user to sign in", async () => {
  const response = await redirectToGitHub(request(), "authorize");
  expect(response.headers.get("location")).toBe("https://fleet.example.com/login");
  expect(mockFetch).not.toHaveBeenCalled();
});

test("resuming authorization forwards the signed-in session without restarting installation", async () => {
  mockFetch.mockResolvedValue(new Response(null, { status: 302, headers: { location: "https://github.com/login/oauth/authorize?state=fresh" } }));
  const response = await redirectToGitHub(request("fleet_token=session-token"), "authorize");
  expect(mockFetch).toHaveBeenCalledWith("http://api.internal/api/v1/integrations/github/authorize?returnTo=%2Fconnections", {
    headers: { Authorization: "Bearer session-token" }, redirect: "manual",
  });
  expect(response.headers.get("location")).toBe("https://github.com/login/oauth/authorize?state=fresh");
});

test("GitHub updates without state recover the original page from a short-lived cookie", async () => {
  mockFetch.mockResolvedValue(new Response(null, { status: 302, headers: { location: "https://github.com/login/oauth/authorize?state=fresh" } }));
  const response = await redirectToGitHub(request("fleet_token=session-token; github_return_to=%2Fprojects%2Fnew"), "authorize");
  expect(mockFetch.mock.calls[0]![0]).toBe("http://api.internal/api/v1/integrations/github/authorize?returnTo=%2Fprojects%2Fnew");
  expect(response.cookies.get("github_return_to")?.value).toBe("/projects/new");
  expect(response.headers.get("set-cookie")).toContain("HttpOnly");
});

test("a tampered return cookie cannot redirect outside Fleet", async () => {
  mockFetch.mockResolvedValue(new Response(null, { status: 302, headers: { location: "https://github.com/login/oauth/authorize" } }));
  await redirectToGitHub(request("fleet_token=session-token; github_return_to=https%3A%2F%2Fevil.example"), "authorize");
  expect(mockFetch.mock.calls[0]![0]).toContain("returnTo=%2Fconnections");
});

test("an expired session returns to login instead of looping through GitHub", async () => {
  mockFetch.mockResolvedValue(new Response(null, { status: 401 }));
  expect((await redirectToGitHub(request("fleet_token=expired"), "authorize")).headers.get("location")).toBe("https://fleet.example.com/login");
});

test("API failures return to Connections with an error", async () => {
  mockFetch.mockResolvedValue(new Response(null, { status: 503 }));
  expect((await redirectToGitHub(request("fleet_token=session-token"), "connect")).headers.get("location")).toBe("https://fleet.example.com/api/integrations/github/complete?github=error&returnTo=%2Fconnections&popup=0");
});

test("a network failure completes the popup instead of leaving an error document open", async () => {
  mockFetch.mockRejectedValue(new Error("API unavailable"));
  const req = new NextRequest("https://fleet.example.com/api/integrations/github/connect?popup=1", { headers: { Cookie: "fleet_token=session-token" } });
  expect((await redirectToGitHub(req, "connect")).headers.get("location")).toBe("https://fleet.example.com/api/integrations/github/complete?github=error&returnTo=%2Fconnections&popup=1");
});

test("the popup preference survives a GitHub setup return that has no state", async () => {
  mockFetch.mockResolvedValue(new Response(null, { status: 302, headers: { location: "https://github.com/login/oauth/authorize" } }));
  const response = await redirectToGitHub(request("fleet_token=session-token; github_popup=1"), "authorize");
  expect(response.cookies.get("github_popup")?.value).toBe("1");
});
