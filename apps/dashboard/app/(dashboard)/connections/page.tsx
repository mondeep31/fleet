"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { CheckCircle, Warning, X } from "@phosphor-icons/react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import type { GitHubStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type Provider = "github" | "gitlab" | "bitbucket";

const PROVIDER_ICONS: Record<
  Provider,
  { src: string; alt: string; className?: string }
> = {
  github: {
    src: "/github-svgrepo-com.svg",
    alt: "GitHub",
    className: "dark:invert",
  },
  gitlab: {
    src: "/gitlab-svgrepo-com.svg",
    alt: "GitLab",
  },
  bitbucket: {
    src: "/bitbucketpipeline-svgrepo-com.svg",
    alt: "Bitbucket",
  },
};

function ProviderIcon({
  provider,
  className,
}: {
  provider: Provider;
  className?: string;
}) {
  const icon = PROVIDER_ICONS[provider];
  return (
    <img
      src={icon.src}
      alt={icon.alt}
      className={cn("size-4", icon.className, className)}
    />
  );
}

function GitHubCard() {
  const { data: status, isLoading, mutate } = useSWR<GitHubStatus>(
    "github-status",
    () => api.getGitHubStatus(),
    { revalidateOnFocus: false },
  );
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  async function handleDisconnect() {
    setDisconnecting(true);
    setDisconnectError(null);
    try {
      await api.disconnectGitHub();
      await mutate();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to disconnect";
      setDisconnectError(msg);
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-[var(--bg-elevated)]">
            <ProviderIcon provider="github" />
          </div>
          <div>
            <p className="text-sm font-medium">GitHub</p>
            {isLoading ? (
              <p className="mt-0.5 text-xs text-muted-foreground">Loading…</p>
            ) : status?.connected ? (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle className="size-3.5 text-green-500" weight="fill" />
                Connected as{" "}
                <span className="font-mono font-medium text-foreground">
                  @{status.username}
                </span>
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">Not connected</p>
            )}
          </div>
        </div>

        <div className="shrink-0">
          {status?.connected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </Button>
          ) : (
            <Button render={<a href="/api/integrations/github/connect" />} nativeButton={false} size="sm">
              Connect
            </Button>
          )}
        </div>
      </div>

      {disconnectError && (
        <p className="mt-3 text-xs text-destructive">{disconnectError}</p>
      )}
    </div>
  );
}

function ComingSoonCard({
  name,
  provider,
}: {
  name: string;
  provider: Provider;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 opacity-60">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-[var(--bg-elevated)]">
          <ProviderIcon provider={provider} />
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Coming soon</p>
        </div>
      </div>
    </div>
  );
}

export default function ConnectionsPage() {
  const searchParams = useSearchParams();

  // Initialise banner from OAuth return params once on first render.
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(() => {
    const github = searchParams.get("github");
    if (github === "connected") return { type: "success", text: "GitHub connected successfully." };
    if (github === "error") return { type: "error", text: "GitHub connection failed. Please try again." };
    return null;
  });

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header title="Connections" />

      <div className="flex-1 px-4 py-6 md:px-6 md:py-8">
        {banner && (
          <div
            className={cn(
              "mb-6 flex items-center justify-between rounded-lg px-4 py-3 text-sm",
              banner.type === "success"
                ? "bg-green-500/10 text-green-400"
                : "bg-destructive/10 text-destructive",
            )}
          >
            <span className="flex items-center gap-2">
              {banner.type === "success" ? (
                <CheckCircle className="size-4" weight="fill" />
              ) : (
                <Warning className="size-4" weight="fill" />
              )}
              {banner.text}
            </span>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="ml-4 shrink-0 text-current opacity-70 hover:opacity-100"
            >
              <X className="size-4" />
              <span className="sr-only">Dismiss</span>
            </button>
          </div>
        )}

        <div className="max-w-xl space-y-3">
          <GitHubCard />
          <ComingSoonCard name="GitLab" provider="gitlab" />
          <ComingSoonCard name="Bitbucket" provider="bitbucket" />
        </div>
      </div>
    </div>
  );
}
