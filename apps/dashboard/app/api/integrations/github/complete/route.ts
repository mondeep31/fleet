import type { NextRequest } from "next/server";
import { completeGitHubConnection } from "@/lib/github-completion";

export function GET(request: NextRequest) {
  return completeGitHubConnection(request);
}
