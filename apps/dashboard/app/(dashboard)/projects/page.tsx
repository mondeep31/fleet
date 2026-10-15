"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MagnifyingGlass, Plus, RocketLaunch } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/use-projects";

function NewProjectButton() {
  return (
    <Button render={<Link href="/projects/new" />} nativeButton={false}>
      <Plus data-icon="inline-start" />
      New project
    </Button>
  );
}

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const { projects, isLoading, error, mutate } = useProjects();
  const [query, setQuery] = useState("");
  useEffect(() => {
    const github = searchParams.get("github");
    if (github === "connected") toast.success("GitHub connected successfully.");
    if (github === "error") toast.error("GitHub connection failed. Please try again.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const visibleProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return projects;

    return projects.filter((project) => {
      const latest = project.latestDeployment;
      return [project.name, project.repoUrl, latest?.url, latest?.status]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized));
    });
  }, [projects, query]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header title="Projects" actions={<NewProjectButton />} />

      <div>
        <div className="dashboard-container flex flex-col gap-6 px-5 pt-9 pb-5 md:px-8 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-xl font-medium tracking-[-0.035em]">Your services</h2><p className="mt-2 text-sm text-muted-foreground">Deployments, activity, and the code behind them.</p></div>
          <div className="relative w-full flex-none sm:w-64">
            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects"
              aria-label="Search projects"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="dashboard-container flex-1 px-5 pb-10 md:px-8">
        {isLoading && (
          <div className="divide-y divide-border border-t border-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 px-1 py-5"
              >
                <div className="space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-48" />
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
          <div className="mt-4 flex min-h-[26rem] flex-col items-center justify-center rounded-lg border border-dashed border-input px-5 py-16 text-center">
            <div className="mb-5 flex size-11 items-center justify-center rounded-xl border border-border bg-card">
              <RocketLaunch className="size-6 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-medium tracking-[-0.03em]">Deploy your first project</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Connect a GitHub repository to build your container and bring your backend online.
            </p>
            <div className="mt-6">
              <NewProjectButton />
            </div>
          </div>
        )}

        {!isLoading &&
          !error &&
          projects.length > 0 &&
          visibleProjects.length === 0 && (
            <div className="border-t border-border px-4 py-16 text-center text-sm text-muted-foreground">
              No projects match your search.
            </div>
          )}

        {!isLoading && !error && visibleProjects.length > 0 && (
          <div className="min-w-0 border-t border-border">
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
