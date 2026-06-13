"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import {
  isActiveStatus,
  type Deployment,
} from "@/lib/types";

export function useDeploymentsByProject(projectId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<{ deployments: Deployment[] }>(
    projectId ? `deployments-project-${projectId}` : null,
    () => api.getDeploymentsByProject(projectId!),
    {
      refreshInterval: (latestData) => {
        const latest = latestData?.deployments?.[0];
        if (!latest) return 0;
        return isActiveStatus(latest.status) ? 5000 : 0;
      },
    },
  );

  return {
    deployments: data?.deployments ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useDeployment(deploymentId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<Deployment>(
    deploymentId ? `deployment-${deploymentId}` : null,
    () => api.getDeployment(deploymentId!),
    {
      refreshInterval: (latestData) => {
        if (!latestData) return 0;
        return isActiveStatus(latestData.status) ? 3000 : 0;
      },
    },
  );

  return {
    deployment: data,
    isLoading,
    error,
    mutate,
  };
}
