"use client";

import Link from "next/link";
import { ArrowSquareOut, GitBranch } from "@phosphor-icons/react";
import { StatusBadge } from "@/components/ui/status-badge";
import { extractRepoDomain, formatRelativeTime } from "@/lib/format";
import type { ProjectWithLatestDeploy } from "@/lib/types";

export function ProjectCard({ project }: { project: ProjectWithLatestDeploy }) {
  const latest = project.latestDeployment;
  const domain = extractRepoDomain(project.repoUrl);

  return (
    <Link
      href={`/projects/${project.projectId}`}
      className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border px-6 py-4 transition-colors hover:bg-[var(--bg-elevated)]/50"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="truncate font-medium">{project.name}</h3>
          {latest && <StatusBadge status={latest.status} />}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <GitBranch className="size-3.5" />
            {domain}
          </span>
          {latest?.createdAt && (
            <span className="tabular-nums">
              {formatRelativeTime(latest.createdAt)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        {latest?.url ? (
          <a
            href={latest.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            {latest.url.replace(/^https?:\/\//, "")}
            <ArrowSquareOut className="size-3.5" />
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    </Link>
  );
}
