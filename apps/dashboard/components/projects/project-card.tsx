"use client";

import Link from "next/link";
import { ArrowSquareOut, GitBranch, GitCommit, Stack } from "@phosphor-icons/react";
import { ProjectCardMenu } from "@/components/projects/project-card-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { extractRepoDomain } from "@/lib/format";
import { RelativeTime } from "@/components/ui/relative-time";
import { isActiveStatus, type ProjectWithLatestDeploy } from "@/lib/types";

function displayCommitMessage(latest: ProjectWithLatestDeploy["latestDeployment"]): string {
  if (!latest) return "No deployments yet";
  if (latest.commitMessage && latest.commitMessage !== "Initial deploy") return latest.commitMessage;
  if (isActiveStatus(latest.status)) return "Deploy in progress";
  return latest.commitMessage || "No commit message";
}

export function ProjectCard({ project, onChanged }: { project: ProjectWithLatestDeploy; onChanged: () => void }) {
  const latest = project.latestDeployment;
  const domain = extractRepoDomain(project.repoUrl);

  return (
    <article className="group grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-4 border-b border-border px-1 py-5 transition-colors hover:bg-card/60 sm:gap-x-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,.85fr)_auto]">
      <Link href={`/projects/${project.projectId}`} className="flex min-w-0 items-center gap-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors group-hover:text-foreground"><Stack className="size-4" /></span>
        <div className="min-w-0"><h2 className="truncate text-sm font-medium tracking-[-0.015em]">{project.name}</h2><p className="mt-1 truncate text-xs text-muted-foreground">{latest?.url ? latest.url.replace(/^https?:\/\//, "") : domain}</p></div>
      </Link>
      <div className="col-span-2 col-start-1 min-w-0 pl-[3.125rem] lg:col-span-1 lg:col-start-auto lg:pl-0">
        <Link href={`/projects/${project.projectId}`} className="flex min-w-0 items-center gap-2 text-xs text-secondary-foreground"><GitCommit className="size-3.5 shrink-0 text-muted-foreground" /><span className="truncate">{displayCommitMessage(latest)}</span></Link>
        <div className="mt-2 flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground"><a href={project.repoUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open repository for ${project.name}`} className="inline-flex min-w-0 items-center gap-1 transition-colors hover:text-foreground"><GitBranch className="size-3 shrink-0" /><span className="truncate">{project.branch}</span></a><span aria-hidden="true">·</span>{latest?.createdAt ? <RelativeTime date={latest.createdAt} /> : <span>Awaiting deployment</span>}</div>
      </div>
      <div className="col-start-2 row-start-1 flex items-center gap-1 sm:gap-2 lg:col-start-auto lg:row-start-auto">
        {latest ? <StatusBadge status={latest.status} className="mr-2 text-[11px]" /> : <span className="mr-3 text-xs text-muted-foreground">Not deployed</span>}
        {latest?.url && <a href={latest.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${project.name}`} className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><ArrowSquareOut className="size-3.5" /></a>}
        <ProjectCardMenu projectId={project.projectId} latestDeployment={latest} onChanged={onChanged} />
      </div>
    </article>
  );
}
