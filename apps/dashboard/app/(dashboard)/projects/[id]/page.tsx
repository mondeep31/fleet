"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { Header } from "@/components/layout/header";
import { VirtualDeploymentList } from "@/components/deployments/virtual-deployment-list";
import { EnvVariablesCard } from "@/components/projects/env-variables-card";
import { DomainsCard } from "@/components/projects/domains-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeploymentsByProject } from "@/hooks/use-deployments";
import { useProjects } from "@/hooks/use-projects";
import { api, ApiError } from "@/lib/api";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const { projects, isLoading: projectsLoading } = useProjects();
  const {
    deployments,
    isLoading: deploymentsLoading,
    error,
    mutate,
  } = useDeploymentsByProject(projectId);

  const [redeploying, setRedeploying] = useState(false);
  const [redeployError, setRedeployError] = useState<string | null>(null);

  const project = useMemo(
    () => projects.find((p) => p.projectId === projectId),
    [projects, projectId],
  );

  const latestDeployment = deployments[0];
  const isLive = latestDeployment?.status === "live";
  const isLoading = projectsLoading || deploymentsLoading;

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

  const headerActions = isLive ? (
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
  ) : undefined;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header
        title={project?.name ?? "Project"}
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: project?.name ?? "…" },
        ]}
        actions={!isLoading ? headerActions : undefined}
      />

      <div className="flex-1 space-y-6 px-6 py-6">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {!isLoading && !project && (
          <div className="rounded-xl border border-border bg-card px-6 py-12 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <p className="text-muted-foreground">Project not found.</p>
          </div>
        )}

        {!isLoading && project && (
          <>
            <EnvVariablesCard projectId={projectId} onDeployStarted={() => mutate()} />
            <DomainsCard projectId={projectId} />

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
          </>
        )}
      </div>
    </div>
  );
}
