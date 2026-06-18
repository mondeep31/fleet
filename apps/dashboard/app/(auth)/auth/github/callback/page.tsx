"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";

function GitHubCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    const token = searchParams.get("token");
    const message = searchParams.get("message");

    if (error || !token) {
      setErrorMessage(
        message
          ? decodeURIComponent(message)
          : "GitHub sign-in failed. Please try again.",
      );
      return;
    }

    const userId = searchParams.get("userId");
    const name = searchParams.get("name");
    const email = searchParams.get("email");

    if (!userId || !name || !email) {
      setErrorMessage("Incomplete response from GitHub. Please try again.");
      return;
    }

    setSession(token, { userId, name, email });
    router.replace("/projects");
  }, [searchParams, setSession, router]);

  if (errorMessage) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
            {errorMessage}
          </p>
          <Link
            href="/login"
            className="text-sm text-(--text-secondary) underline underline-offset-4 hover:text-(--text-primary) transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <p className="text-sm text-(--text-tertiary)">Signing you in…</p>
    </div>
  );
}

export default function GitHubCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <p className="text-sm text-(--text-tertiary)">Signing you in…</p>
        </div>
      }
    >
      <GitHubCallbackContent />
    </Suspense>
  );
}
