"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass, RocketLaunch } from "@phosphor-icons/react";
import { Header } from "@/components/layout/header";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/use-projects";

export default function ProjectsPage() {
  const { projects, isLoading, error, mutate } = useProjects();
  const [query, setQuery] = useState("");
  const visibleProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return projects;

    return projects.filter((project) => {
      const latest = project.latestDeployment;
      return [
        project.name,
        project.repoUrl,
        latest?.url,
        latest?.status,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized));
    });
  }, [projects, query]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header
        title="Projects"
      />

      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-6">
        <div className="relative w-[clamp(9rem,32vw,20rem)] flex-none">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects..."
            className="pl-9"
          />
        </div>
        <NewProjectDialog onCreated={() => mutate()} />
      </div>

      <div className="flex-1 px-4 py-4 md:px-6 md:py-6">
        {isLoading && (
          <div className="grid gap-3 md:gap-4 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-lg border border-border bg-card px-4 py-4"
              >
                <div className="space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-5 w-32 rounded-full" />
                  <Skeleton className="h-4 w-56" />
                </div>
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
          <div className="flex flex-col items-center justify-center px-4 py-20 text-center md:px-6 md:py-24">
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

        {!isLoading && !error && projects.length > 0 && visibleProjects.length === 0 && (
          <div className="rounded-lg border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            No projects match your search.
          </div>
        )}

        {!isLoading && !error && visibleProjects.length > 0 && (
          <div className="grid gap-3 md:gap-4 xl:grid-cols-2">
            {visibleProjects.map((project) => (
              <ProjectCard
                key={project.projectId}
                project={project}
                onChanged={() => mutate()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
