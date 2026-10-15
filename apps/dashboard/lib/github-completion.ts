import { type NextRequest, NextResponse } from "next/server";
import { dashboardUrl } from "./urls";
import { githubConnectionResult } from "./github-connection-result";

export function completeGitHubConnection(request: NextRequest) {
  const result = githubConnectionResult(request.nextUrl.searchParams.get("github"));
  const requestedReturnTo = request.nextUrl.searchParams.get("returnTo")
    ?? request.cookies.get("github_return_to")?.value;
  const returnTo = requestedReturnTo === "/projects/new" ? "/projects/new" : "/connections";
  const popupQuery = request.nextUrl.searchParams.get("popup");
  const popup = popupQuery === null ? request.cookies.get("github_popup")?.value === "1" : popupQuery === "1";
  const url = dashboardUrl(popup ? "/integrations/github/complete" : returnTo);
  url.searchParams.set("github", result);
  if (popup) url.searchParams.set("returnTo", returnTo);
  const response = NextResponse.redirect(url);
  for (const name of ["github_return_to", "github_popup"]) {
    response.cookies.set(name, "", { path: "/api/integrations/github", maxAge: 0, httpOnly: true, sameSite: "lax" });
  }
  return response;
}
