"use client";

import { RocketLaunch } from "@phosphor-icons/react";
import { Header } from "@/components/layout/header";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/use-projects";

export default function ProjectsPage() {
  const { projects, isLoading, error, mutate } = useProjects();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header
        title="Projects"
        actions={<NewProjectDialog onCreated={() => mutate()} />}
      />

      <div className="flex-1">
        {isLoading && (
          <div className="space-y-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-border px-6 py-4"
              >
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="px-6 py-12 text-center">
            <p className="text-destructive">
              Failed to load projects. Refresh the page to try again.
            </p>
          </div>
        )}

        {!isLoading && !error && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--bg-elevated)]">
              <RocketLaunch className="size-6 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium">Deploy your first project</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Connect a Git repository and Fleet will build and run it on your
              infrastructure.
            </p>
            <div className="mt-6">
              <NewProjectDialog onCreated={() => mutate()} />
            </div>
          </div>
        )}

        {!isLoading && !error && projects.length > 0 && (
          <div>
            <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-border px-6 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span>Project</span>
              <span>URL</span>
            </div>
            {projects.map((project) => (
              <ProjectCard key={project.projectId} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
