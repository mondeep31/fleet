"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { DeploymentLogs } from "@/components/deployments/deployment-logs";
import { DeploymentProgress } from "@/components/deployments/deployment-progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeployment,
} from "@/hooks/use-deployments";
import { useDeploymentLogStream } from "@/hooks/use-deployment-log-stream";
import { api, ApiError } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { isTerminalStatus } from "@/lib/types";

export default function DeploymentDetailPage() {
  const params = useParams<{ id: string }>();
  const deploymentId = params.id;

  const { deployment, isLoading, mutate } = useDeployment(deploymentId);
  const { lines, streamState } = useDeploymentLogStream(
    deploymentId,
    deployment?.status,
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [stopping, setStopping] = useState(false);

  const canStop =
    deployment &&
    !isTerminalStatus(deployment.status) &&
    deployment.status !== "live";

  async function handleStop() {
    if (!deployment) return;
    setStopping(true);
    try {
      await api.stopDeployment(deployment.deploymentId);
      setConfirmOpen(false);
      mutate();
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Failed to stop deployment. Try again.",
      );
    } finally {
      setStopping(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header
        title="Deployment"
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          ...(deployment
            ? [
                {
                  label: "Project",
                  href: `/projects/${deployment.projectId}`,
                },
              ]
            : []),
          { label: deploymentId.slice(0, 8) },
        ]}
        actions={
          canStop ? (
            <Button
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
            >
              Stop Deployment
            </Button>
          ) : undefined
        }
      />

      <div className="dashboard-container flex-1 space-y-6 px-4 py-6 md:px-8">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {deployment && (
          <>
            <section className="rounded-xl border border-border bg-card p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <StatusBadge status={deployment.status} className="text-sm" />
                  <span className="text-sm text-muted-foreground">
                    {formatRelativeTime(deployment.createdAt)}
                  </span>
                </div>
                {deployment.url && (
                  <a
                    href={deployment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-[var(--bg-elevated)] px-3 py-2 text-sm transition-colors hover:border-white/20 hover:bg-primary hover:text-primary-foreground"
                  >
                    {deployment.url}
                    <ArrowSquareOut className="size-4" />
                  </a>
                )}
              </div>

              <DeploymentProgress status={deployment.status} />

              {deployment.error && (
                <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {deployment.error}
                </p>
              )}
            </section>

            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="border-b border-border bg-[var(--bg-elevated)]/45 px-4 py-3">
                <h2 className="text-sm font-medium">Logs</h2>
              </div>
              <DeploymentLogs lines={lines} streamState={streamState} />
            </section>
          </>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Stop Deployment</DialogTitle>
            <DialogDescription>
              This will cancel the build pipeline and remove the running
              container. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={stopping}
              onClick={handleStop}
            >
              {stopping ? "Stopping…" : "Stop Deployment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
