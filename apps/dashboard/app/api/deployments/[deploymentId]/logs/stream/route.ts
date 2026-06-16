import type { NextRequest } from "next/server";
import { apiInternalUrl } from "@/lib/urls";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ deploymentId: string }> },
) {
  const { deploymentId } = await context.params;
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return new Response("Unauthorized", { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      apiInternalUrl(`/api/v1/deployments/${deploymentId}/logs/stream`),
      {
        headers: { Authorization: authorization },
      },
    );
  } catch {
    return new Response("Failed to reach log stream", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(upstream.statusText || "Log stream unavailable", {
      status: upstream.status,
    });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
