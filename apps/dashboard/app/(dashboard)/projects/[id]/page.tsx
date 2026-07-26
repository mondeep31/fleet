"use client";

import { useParams } from "next/navigation";
import { VirtualDeploymentList } from "@/components/deployments/virtual-deployment-list";
import { useDeploymentsByProject } from "@/hooks/use-deployments";

export default function ProjectDeploymentsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const { deployments, error, mutate } = useDeploymentsByProject(projectId);

  return (
    <div className="space-y-4">
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
    </div>
  );
}
