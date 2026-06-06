"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { VirtualDeploymentList } from "@/components/deployments/virtual-deployment-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeploymentsByProject } from "@/hooks/use-deployments";
import { useProjects } from "@/hooks/use-projects";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const { projects, isLoading: projectsLoading } = useProjects();
  const {
    deployments,
    isLoading: deploymentsLoading,
    mutate,
  } = useDeploymentsByProject(projectId);

  const project = useMemo(
    () => projects.find((p) => p.projectId === projectId),
    [projects, projectId],
  );

  const isLoading = projectsLoading || deploymentsLoading;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header
        title={project?.name ?? "Project"}
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: project?.name ?? "…" },
        ]}
      />

      <div className="flex-1 px-6 py-6">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {!isLoading && deployments.length === 0 && (
          <div className="rounded-xl border border-border bg-[var(--bg-surface)] px-6 py-12 text-center">
            <p className="text-muted-foreground">
              No deployments yet. Creating a project starts the first deploy
              automatically.
            </p>
          </div>
        )}

        {!isLoading && deployments.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border">
            <VirtualDeploymentList
              deployments={deployments}
              onStopped={() => mutate()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
