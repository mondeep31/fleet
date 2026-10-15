import { expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("./urls", () => ({ dashboardUrl: (path: string) => new URL(path, "https://fleet.example.com") }));
import { completeGitHubConnection } from "./github-completion";
import { isGitHubConnectionMessage } from "./github-connection-result";

function request(query: string, cookie = "") {
  return new NextRequest(`https://fleet.example.com/api/integrations/github/complete?${query}`, { headers: { Cookie: cookie } });
}

test("popup completion uses the close/notify page and clears its temporary cookies", () => {
  const response = completeGitHubConnection(request("github=connected&returnTo=%2Fprojects%2Fnew", "github_popup=1; github_return_to=%2Fconnections"));
  expect(response.headers.get("location")).toBe("https://fleet.example.com/integrations/github/complete?github=connected&returnTo=%2Fprojects%2Fnew");
  expect(response.cookies.get("github_popup")?.maxAge).toBe(0);
  expect(response.cookies.get("github_return_to")?.maxAge).toBe(0);
});

test("normal navigation still returns to the original page when popups are blocked", () => {
  const response = completeGitHubConnection(request("github=connected&returnTo=%2Fprojects%2Fnew"));
  expect(response.headers.get("location")).toBe("https://fleet.example.com/projects/new?github=connected");
});

test("a full-page failure does not reuse an abandoned popup's cookie", () => {
  const response = completeGitHubConnection(request("github=error&popup=0", "github_popup=1"));
  expect(response.headers.get("location")).toBe("https://fleet.example.com/connections?github=error");
});

test("popup failures close through the same completion flow and preserve the parent page", () => {
  const response = completeGitHubConnection(request("github=approval_required", "github_popup=1; github_return_to=%2Fprojects%2Fnew"));
  expect(response.headers.get("location")).toBe("https://fleet.example.com/integrations/github/complete?github=approval_required&returnTo=%2Fprojects%2Fnew");
});

test("unknown results and external return URLs are rejected", () => {
  const response = completeGitHubConnection(request("github=fake&returnTo=https%3A%2F%2Fevil.example"));
  expect(response.headers.get("location")).toBe("https://fleet.example.com/connections?github=error");
});

test("only known connection messages are accepted by the popup listener", () => {
  expect(isGitHubConnectionMessage({ type: "fleet:github:complete", result: "connected" })).toBe(true);
  expect(isGitHubConnectionMessage({ type: "fleet:github:complete", result: "anything" })).toBe(false);
  expect(isGitHubConnectionMessage({ type: "other", result: "connected" })).toBe(false);
  expect(isGitHubConnectionMessage(null)).toBe(false);
});
