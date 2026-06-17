import { type NextRequest, NextResponse } from "next/server";
import { apiInternalUrl, dashboardUrl } from "@/lib/urls";

/**
 * Initiates the GitHub login OAuth flow by forwarding the browser to the API
 * authorize endpoint. No Bearer token is required — this is a public route.
 */
export async function GET(_request: NextRequest) {
  let upstream: Response;
  try {
    upstream = await fetch(apiInternalUrl("/v1/auth/github/authorize"), {
      redirect: "manual",
    });
  } catch {
    return new NextResponse("Failed to reach API", { status: 502 });
  }

  const location = upstream.headers.get("location");
  if ((upstream.status === 301 || upstream.status === 302) && location) {
    return NextResponse.redirect(location);
  }

  return NextResponse.redirect(
    dashboardUrl("/login?error=oauth_unavailable"),
  );
}
