import { type NextRequest, NextResponse } from "next/server";
import { apiInternalUrl, dashboardUrl } from "./urls";

/** Browser navigations carry the Fleet cookie; the API requires a Bearer token. */
export async function redirectToGitHub(
  request: NextRequest,
  action: "connect" | "authorize" | "install",
) {
  const token = request.cookies.get("fleet_token")?.value;
  if (!token) return NextResponse.redirect(dashboardUrl("/login"));
  const requestedReturnTo = request.nextUrl.searchParams.get("returnTo")
    ?? (action === "authorize" ? request.cookies.get("github_return_to")?.value : undefined);
  const returnTo = requestedReturnTo === "/projects/new" ? "/projects/new" : "/connections";
  const popup = request.nextUrl.searchParams.get("popup") === "1"
    || (action === "authorize" && request.cookies.get("github_popup")?.value === "1");
  function failedConnection() {
    const url = dashboardUrl("/api/integrations/github/complete?github=error");
    url.searchParams.set("returnTo", returnTo);
    url.searchParams.set("popup", popup ? "1" : "0");
    return NextResponse.redirect(url);
  }

  let upstream: Response;
  try {
    upstream = await fetch(apiInternalUrl(`/api/v1/integrations/github/${action}?${new URLSearchParams({ returnTo })}`), {
      headers: { Authorization: `Bearer ${token}` },
      redirect: "manual",
    });
  } catch {
    return failedConnection();
  }

  const location = upstream.headers.get("location");
  if ((upstream.status === 301 || upstream.status === 302) && location) {
    const response = NextResponse.redirect(location);
    // GitHub can omit state when editing an existing installation. Keep the
    // return page on the dashboard; user identity still comes from its JWT.
    response.cookies.set("github_return_to", returnTo, {
      httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:",
      path: "/api/integrations/github", maxAge: 600,
    });
    response.cookies.set("github_popup", popup ? "1" : "0", {
      httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:",
      path: "/api/integrations/github", maxAge: 600,
    });
    return response;
  }
  if (upstream.status === 401 && !popup) return NextResponse.redirect(dashboardUrl("/login"));
  return failedConnection();
}
