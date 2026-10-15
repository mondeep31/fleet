import { type NextRequest, NextResponse } from "next/server";
import { apiInternalUrl, dashboardUrl } from "./urls";

/** Browser navigations carry the Fleet cookie; the API requires a Bearer token. */
export async function redirectToGitHub(
  request: NextRequest,
  action: "connect" | "authorize",
) {
  const token = request.cookies.get("fleet_token")?.value;
  if (!token) return NextResponse.redirect(dashboardUrl("/login"));
  const requestedReturnTo = request.nextUrl.searchParams.get("returnTo")
    ?? (action === "authorize" ? request.cookies.get("github_return_to")?.value : undefined);
  const returnTo = requestedReturnTo === "/projects/new" ? "/projects/new" : "/connections";

  let upstream: Response;
  try {
    upstream = await fetch(apiInternalUrl(`/api/v1/integrations/github/${action}?${new URLSearchParams({ returnTo })}`), {
      headers: { Authorization: `Bearer ${token}` },
      redirect: "manual",
    });
  } catch {
    return new NextResponse("Failed to reach API", { status: 502 });
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
    return response;
  }
  if (upstream.status === 401) return NextResponse.redirect(dashboardUrl("/login"));
  return NextResponse.redirect(dashboardUrl("/connections?github=error"));
}
