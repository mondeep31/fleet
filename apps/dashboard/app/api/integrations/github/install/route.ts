import type { NextRequest } from "next/server";
import { redirectToGitHub } from "@/lib/github-redirect";

export async function GET(request: NextRequest) {
  return redirectToGitHub(request, "install");
}
