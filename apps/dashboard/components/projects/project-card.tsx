"use client";

import Link from "next/link";
import { ArrowSquareOut, GitBranch } from "@phosphor-icons/react";
import { ProjectCardMenu } from "@/components/projects/project-card-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { extractRepoDomain, formatRelativeTime } from "@/lib/format";
import { isActiveStatus, type ProjectWithLatestDeploy } from "@/lib/types";

function displayCommitMessage(
  latest: ProjectWithLatestDeploy["latestDeployment"],
): string {
  if (!latest) return "No deployments yet";
  if (latest.commitMessage && latest.commitMessage !== "Initial deploy") {
    return latest.commitMessage;
  }
  if (isActiveStatus(latest.status)) return "Deploy in progress";
  return latest.commitMessage || "No commit message";
}

export function ProjectCard({
  project,
  onChanged,
}: {
  project: ProjectWithLatestDeploy;
  onChanged: () => void;
}) {
  const latest = project.latestDeployment;
  const domain = extractRepoDomain(project.repoUrl);

  return (
    <div className="group relative flex min-h-32 min-w-0 flex-col justify-between overflow-hidden rounded-lg border border-border bg-card px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:border-white/20 hover:bg-[#292927]">
      <div className="flex min-w-0 items-start gap-3">
        <Link
          href={`/projects/${project.projectId}`}
          className="flex min-w-0 flex-1 items-start gap-3"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black text-white ring-1 ring-white/10">
            <GitBranch className="size-3.5" weight="bold" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold leading-5">
              {project.name}
            </h3>
            <p className="min-w-0 truncate text-xs leading-5 text-muted-foreground">
              {latest?.url
                ? latest.url.replace(/^https?:\/\//, "")
                : domain}
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5">
          {latest && (
            <StatusBadge
              status={latest.status}
              className="h-7 px-2.5 text-xs leading-none"
            />
          )}
          {latest?.url && (
            <a
              href={latest.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${project.name}`}
              onClick={(e) => e.stopPropagation()}
              className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-[var(--bg-inset)] text-muted-foreground transition-colors hover:bg-[var(--bg-elevated)] hover:text-foreground"
            >
              <ArrowSquareOut className="size-4 shrink-0" />
            </a>
          )}
          <ProjectCardMenu
            projectId={project.projectId}
            latestDeployment={latest}
            onChanged={onChanged}
          />
        </div>
      </div>

      <div className="mt-4 block min-w-0 space-y-3">
        <a
          href={project.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[var(--bg-elevated)] px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-[var(--bg-inset)]"
        >
          <GitBranch className="size-3" weight="bold" />
          <span className="truncate">{domain}</span>
        </a>

        <Link
          href={`/projects/${project.projectId}`}
          className="block min-w-0 text-xs"
        >
          <p className="truncate font-medium text-foreground">
            {displayCommitMessage(latest)}
          </p>
          <p className="mt-1 truncate text-muted-foreground">
            {latest?.createdAt
              ? `${formatRelativeTime(latest.createdAt)} on ${project.branch}`
              : "Waiting for first deployment"}
          </p>
        </Link>
      </div>
    </div>
  );
}
