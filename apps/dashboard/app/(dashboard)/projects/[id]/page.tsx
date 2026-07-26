"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { VirtualDeploymentList } from "@/components/deployments/virtual-deployment-list";
import { Button } from "@/components/ui/button";
import { useDeploymentsByProject } from "@/hooks/use-deployments";
import { api, ApiError } from "@/lib/api";

export default function ProjectDeploymentsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const { deployments, error, mutate } = useDeploymentsByProject(projectId);

  const [redeploying, setRedeploying] = useState(false);
  const [redeployError, setRedeployError] = useState<string | null>(null);

  const latestDeployment = deployments[0];
  const isLive = latestDeployment?.status === "live";

  async function handleRedeploy() {
    setRedeploying(true);
    setRedeployError(null);
    try {
      await api.startProjectDeployment(projectId);
      await mutate();
    } catch (err) {
      setRedeployError(
        err instanceof ApiError ? err.message : "Failed to start redeploy.",
      );
    } finally {
      setRedeploying(false);
    }
  }

  return (
    <div className="space-y-4">
      {isLive && (
        <div className="flex flex-col items-end gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={redeploying}
            onClick={() => void handleRedeploy()}
            className="gap-1.5"
          >
            <ArrowCounterClockwise className="size-4" />
            {redeploying ? "Starting…" : "Redeploy"}
          </Button>
          {redeployError && (
            <p className="text-xs text-destructive">{redeployError}</p>
          )}
        </div>
      )}

      {deployments.length === 0 && !error && (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <p className="text-muted-foreground">
            No deployments yet. Creating a project starts the first deploy
            automatically.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <p className="text-muted-foreground">Project not found.</p>
        </div>
      )}

      {deployments.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <VirtualDeploymentList
            deployments={deployments}
            onStopped={() => mutate()}
          />
        </div>
      )}
    </div>
  );
}
