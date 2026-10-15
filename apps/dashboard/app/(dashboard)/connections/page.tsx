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
  const { data: status, error: statusError, isLoading, mutate } = useSWR<GitHubStatus>(
    "github-status",
    () => api.getGitHubStatus(),
    { revalidateOnFocus: true },
  );
  const [disconnecting, setDisconnecting] = useState(false);
  const accessLabel = status?.repositorySelection === "all"
    ? "All repositories"
    : status?.repositorySelection === "mixed"
      ? "Selected and full account access"
      : status?.repositorySelection === "none" || status?.repositoryCount === 0
        ? "No repositories granted"
        : "Limited repository access";

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
            ) : statusError ? (
              <p className="mt-1 text-xs text-destructive">Could not verify your GitHub connection. Try again.</p>
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
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {status?.connected && status.fineGrained
                ? `${accessLabel}${status.repositoryCount !== undefined ? ` · ${status.repositoryCount} ${status.repositoryCount === 1 ? "repository" : "repositories"}` : ""}${status.contentsPermission === "read" ? " · Read-only code" : status.contentsPermission === "write" ? " · Read and write code" : ""}`
                : status?.connected
                ? "Upgrade to choose specific repositories and grant read-only code access."
                : status?.needsReconnect
                ? "Your GitHub authorization needs to be renewed. Your repository selection is saved on GitHub."
                : "Choose which repositories Fleet can read and deploy. Signing in does not grant repository access."}
            </p>
            {!isLoading && !statusError && status?.connected && (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Can’t see your repository?{" "}
                <a href="/api/integrations/github/connect?returnTo=/connections" className="text-foreground underline underline-offset-4">
                  Add repository access
                </a>
              </p>
            )}
            {!isLoading && !statusError && !status?.connected && (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Already installed Fleet on GitHub?{" "}
                <a href="/api/integrations/github/authorize?returnTo=/connections" className="text-foreground underline underline-offset-4">
                  Finish connecting
                </a>
              </p>
            )}
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
          {statusError ? (
            <Button variant="outline" size="sm" onClick={() => void mutate()}>Retry</Button>
          ) : status?.connected ? (
            <>
            <Button
              render={<a href={status.needsReconnect ? "/api/integrations/github/authorize?returnTo=/connections" : "/api/integrations/github/connect?returnTo=/connections"} />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              {status.needsReconnect ? "Reconnect GitHub" : "Manage repositories"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full sm:w-auto"
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </Button>
            </>
          ) : (
            <Button render={<a href={status?.needsReconnect ? "/api/integrations/github/authorize?returnTo=/connections" : "/api/integrations/github/connect?returnTo=/connections"} />} nativeButton={false} size="sm" className="w-full sm:w-auto" disabled={isLoading}>
              {status?.needsReconnect ? "Reconnect" : "Connect"}
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
    if (github === "approval_required") toast.info("Your organization owner needs to approve the GitHub App installation. Connect again after approval.");
    if (github === "installation_required") toast.error("Install Fleet with read access to repository contents. Your organization owner may need to approve the installation.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header title="Connections" />

      <div className="dashboard-container flex-1 px-5 py-9 md:px-8">
        <div className="mb-8"><h2 className="text-xl font-medium tracking-[-0.035em]">Connected accounts</h2><p className="mt-2 text-sm text-muted-foreground">Manage the Git providers you deploy from.</p></div>
        <div className="max-w-3xl overflow-hidden border-y border-border">
          <GitHubCard />
          <ComingSoonCard name="GitLab" provider="gitlab" />
          <ComingSoonCard name="Bitbucket" provider="bitbucket" />
        </div>
      </div>
    </div>
  );
}
