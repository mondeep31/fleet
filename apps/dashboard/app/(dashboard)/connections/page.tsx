"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
    className: "invert",
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
    <Image
      src={icon.src}
      alt={icon.alt}
      width={16}
      height={16}
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
    <div className="border-b border-border px-4 py-4 last:border-b-0 sm:px-6 sm:py-5">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-[#171717]">
            <ProviderIcon provider="github" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">GitHub</p>
            {isLoading ? (
              <p className="mt-0.5 text-xs text-muted-foreground">Loading…</p>
            ) : status?.connected ? (
              <p className="mt-1 flex min-w-0 items-start gap-1.5 text-xs leading-5 text-muted-foreground">
                <CheckCircle className="mt-0.5 size-3.5 shrink-0 text-green-500" weight="fill" />
                <span className="min-w-0">
                  Connected as{" "}
                  <span className="break-all font-mono font-medium text-foreground">
                    @{status.username}
                  </span>
                </span>
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">Not connected</p>
            )}
          </div>
        </div>

        <div className="w-full shrink-0 sm:w-auto">
          {status?.connected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full sm:w-auto"
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </Button>
          ) : (
            <Button render={<a href="/api/integrations/github/connect" />} nativeButton={false} size="sm" className="w-full sm:w-auto">
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
    <div className="border-b border-border px-4 py-4 opacity-55 last:border-b-0 sm:px-6 sm:py-5">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-[#171717]">
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
        <div className="max-w-2xl overflow-hidden rounded-lg border border-border bg-card">
          <GitHubCard />
          <ComingSoonCard name="GitLab" provider="gitlab" />
          <ComingSoonCard name="Bitbucket" provider="bitbucket" />
        </div>
      </div>
    </div>
  );
}
