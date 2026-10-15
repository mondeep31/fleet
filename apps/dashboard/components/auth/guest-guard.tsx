"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, selectIsAuthenticated } from "@/stores/auth-store";
import { Skeleton } from "@/components/ui/skeleton";

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  useLayoutEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace("/projects");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated) {
    return (
      <div className="auth-loading flex min-h-[100dvh] items-center justify-center bg-background" aria-busy="true">
        <div className="w-full max-w-md space-y-3 px-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return children;
}
