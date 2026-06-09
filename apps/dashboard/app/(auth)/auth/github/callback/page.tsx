"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { useAuthStore } from "@/stores/auth-store";

function GitHubCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    const userId = params.get("userId");
    const name = params.get("name");
    const email = params.get("email");

    if (!token || !userId || !name || !email) {
      setError("GitHub sign in did not return a valid session.");
      return;
    }

    setSession(token, { userId, name, email });
    router.replace("/projects");
  }, [params, router, setSession]);

  return (
    <AuthShell
      title={error ? "GitHub sign in failed" : "Signing you in"}
      subtitle={
        error ?? "Finishing your GitHub session and opening your dashboard"
      }
    >
      {error && (
        <a
          href="/login"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-[var(--bg-elevated)] px-3 text-sm font-medium text-foreground transition-colors hover:border-white/20 hover:bg-[#3a3a37]"
        >
          Back to login
        </a>
      )}
    </AuthShell>
  );
}

export default function GitHubCallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Signing you in"
          subtitle="Finishing your GitHub session"
        >
          <div className="h-10" />
        </AuthShell>
      }
    >
      <GitHubCallback />
    </Suspense>
  );
}
