"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { GITHUB_CONNECTION_CHANNEL, GITHUB_CONNECTION_MESSAGE, githubConnectionResult } from "@/lib/github-connection-result";

function GitHubCompletion() {
  const params = useSearchParams();
  const result = githubConnectionResult(params.get("github"));
  const returnTo = params.get("returnTo") === "/projects/new" ? "/projects/new" : "/connections";

  useEffect(() => {
    const message = { type: GITHUB_CONNECTION_MESSAGE, result };
    // BroadcastChannel also works if GitHub's browser isolation severs opener.
    try {
      const channel = new BroadcastChannel(GITHUB_CONNECTION_CHANNEL);
      channel.postMessage(message);
      channel.close();
    } catch { /* postMessage remains available when BroadcastChannel is unsupported. */ }
    try {
      window.opener?.postMessage(message, window.location.origin);
    } catch { /* A closed or isolated opener must not prevent closing the popup. */ }
    window.close();
  }, [result]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 text-center">
      <div className="space-y-3">
        <h1 className="text-lg font-medium">{result === "connected" ? "Redirecting to Fleet…" : result === "approval_required" ? "Organization approval required" : "GitHub connection incomplete"}</h1>
        <a href={`${returnTo}?github=${result}`} className="text-sm text-muted-foreground underline underline-offset-4">Return to Fleet</a>
      </div>
    </main>
  );
}

export default function GitHubCompletionPage() {
  return <Suspense><GitHubCompletion /></Suspense>;
}
