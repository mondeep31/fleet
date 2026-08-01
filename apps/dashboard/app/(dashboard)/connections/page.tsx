"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
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
    src: "/images/integrations/github.svg",
    alt: "GitHub",
    className: "dark:invert",
  },
  gitlab: {
    src: "/images/integrations/gitlab.svg",
    alt: "GitLab",
  },
  bitbucket: {
    src: "/images/integrations/bitbucket.svg",
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

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await api.disconnectGitHub();
      await mutate();
      toast.success("GitHub disconnected.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to disconnect";
      toast.error(msg);
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="border-b border-border py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center border border-border bg-[var(--bg-elevated)]">
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
    <div className="border-b border-border py-6 opacity-55">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center border border-border bg-[var(--bg-elevated)]">
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

  useEffect(() => {
    const github = searchParams.get("github");
    if (github === "connected") toast.success("GitHub connected successfully.");
    if (github === "error") toast.error("GitHub connection failed. Please try again.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header title="Connections" />

      <div className="dashboard-container flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="max-w-2xl border-t border-border">
          <GitHubCard />
          <ComingSoonCard name="GitLab" provider="gitlab" />
          <ComingSoonCard name="Bitbucket" provider="bitbucket" />
        </div>
      </div>
    </div>
  );
}
