import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { dashboardUrl } from "@/lib/urls";

const GUEST_ONLY_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("fleet_token")?.value?.trim();

  if (token && GUEST_ONLY_PATHS.includes(pathname)) {
    return NextResponse.redirect(dashboardUrl("/projects"));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup", "/forgot-password", "/reset-password"],
};
