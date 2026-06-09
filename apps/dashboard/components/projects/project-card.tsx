"use client";

import Link from "next/link";
import { ArrowSquareOut, DotsThree, GitBranch } from "@phosphor-icons/react";
import { StatusBadge } from "@/components/ui/status-badge";
import { extractRepoDomain, formatRelativeTime } from "@/lib/format";
import type { ProjectWithLatestDeploy } from "@/lib/types";

export function ProjectCard({ project }: { project: ProjectWithLatestDeploy }) {
  const latest = project.latestDeployment;
  const domain = extractRepoDomain(project.repoUrl);

  return (
    <Link
      href={`/projects/${project.projectId}`}
      className="group flex min-h-32 flex-col justify-between rounded-lg border border-border bg-card px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:border-white/20 hover:bg-[#292927]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black text-white ring-1 ring-white/10">
            <GitBranch className="size-3.5" weight="bold" />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="truncate text-sm font-semibold leading-5">
                {project.name}
              </h3>
              {latest && <StatusBadge status={latest.status} />}
            </div>
            <p className="truncate text-xs leading-5 text-muted-foreground">
              {latest?.url
                ? latest.url.replace(/^https?:\/\//, "")
                : domain}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {latest?.url && (
            <a
              href={latest.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${project.name}`}
              onClick={(e) => e.stopPropagation()}
              className="flex size-7 items-center justify-center rounded-full border border-border bg-[var(--bg-inset)] text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <ArrowSquareOut className="size-3.5" />
            </a>
          )}
          <span className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover:bg-[var(--bg-elevated)] group-hover:text-foreground">
            <DotsThree className="size-4" weight="bold" />
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[var(--bg-elevated)] px-2 py-1 text-xs font-medium text-foreground">
          <GitBranch className="size-3" weight="bold" />
          <span className="truncate">{domain}</span>
        </span>

        <div className="min-w-0 text-xs">
          <p className="truncate font-medium text-foreground">
            {latest ? `Latest deploy ${latest.status.replace("_", " ")}` : "No deployments yet"}
          </p>
          <p className="mt-1 truncate text-muted-foreground">
            {latest?.createdAt ? `${formatRelativeTime(latest.createdAt)} on main` : "Waiting for first deployment"}
          </p>
        </div>
      </div>
    </Link>
  );
}
