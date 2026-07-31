"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

function GitHubCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    const error = searchParams.get("error");
    const token = searchParams.get("token");
    const message = searchParams.get("message");

    if (error || !token) {
      toast.error(
        message
          ? decodeURIComponent(message)
          : "GitHub sign-in failed. Please try again.",
      );
      router.replace("/login");
      return;
    }

    const userId = searchParams.get("userId");
    const name = searchParams.get("name");
    const email = searchParams.get("email");

    if (!userId || !name || !email) {
      toast.error("Incomplete response from GitHub. Please try again.");
      router.replace("/login");
      return;
    }

    setSession(token, { userId, name, email });
    router.replace("/projects");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
