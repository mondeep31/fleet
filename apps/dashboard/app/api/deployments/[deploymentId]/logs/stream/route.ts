import type { NextRequest } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:3010";

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
      `${API_URL}/api/v1/deployments/${deploymentId}/logs/stream`,
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
