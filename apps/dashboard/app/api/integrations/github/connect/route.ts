import { type NextRequest, NextResponse } from "next/server";
import { apiInternalUrl, dashboardUrl } from "@/lib/urls";

/**
 * Proxy that forwards the Fleet JWT (from the fleet_token cookie) as a Bearer
 * header to the API /connect endpoint, then follows the 302 redirect to GitHub.
 *
 * The browser cannot send Authorization headers on a navigation, so we do it
 * server-side and return the GitHub authorize URL as a client redirect.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get("fleet_token")?.value;

  if (!token) {
    return NextResponse.redirect(dashboardUrl("/login"));
  }

  let upstream: Response;
  try {
    upstream = await fetch(apiInternalUrl("/api/v1/integrations/github/connect"), {
        headers: { Authorization: `Bearer ${token}` },
        redirect: "manual",
      },
    );
  } catch {
    return new NextResponse("Failed to reach API", { status: 502 });
  }

  const location = upstream.headers.get("location");
  if ((upstream.status === 301 || upstream.status === 302) && location) {
    return NextResponse.redirect(location);
  }

  return NextResponse.redirect(dashboardUrl("/connections?github=error"));
}
