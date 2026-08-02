"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeploymentsByProject } from "@/hooks/use-deployments";
import { useProjects } from "@/hooks/use-projects";
import { api, ApiError } from "@/lib/api";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const { projects, isLoading } = useProjects();
  const { deployments, mutate } = useDeploymentsByProject(projectId);

  const [redeploying, setRedeploying] = useState(false);

  const project = useMemo(
    () => projects.find((p) => p.projectId === projectId),
    [projects, projectId],
  );

  const isLive = deployments[0]?.status === "live";

  async function handleRedeploy() {
    setRedeploying(true);
    try {
      await api.startProjectDeployment(projectId);
      await mutate();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to start redeploy.",
      );
    } finally {
      setRedeploying(false);
    }
  }

  const headerActions = isLive ? (
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

      {!isLoading && project && <ProjectTabs projectId={projectId} />}

      <div className="dashboard-container flex-1 space-y-4 px-4 py-6 md:px-8">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {!isLoading && !project && (
          <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-[0_16px_40px_-34px_rgba(18,28,23,.35)]">
            <p className="text-muted-foreground">Project not found.</p>
          </div>
        )}

        {!isLoading && project && children}
      </div>
    </div>
  );
}
