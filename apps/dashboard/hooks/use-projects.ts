"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import { isActiveStatus, type ProjectWithLatestDeploy } from "@/lib/types";

export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<ProjectWithLatestDeploy[]>(
    "projects-with-deploy",
    () => api.getProjectsWithLatestDeploy(),
    {
      refreshInterval: (latestData) => {
        const hasActive = latestData?.some((p) =>
          p.latestDeployment
            ? isActiveStatus(p.latestDeployment.status)
            : false,
        );
        return hasActive ? 5000 : 0;
      },
    },
  );

  return {
    projects: data ?? [],
    isLoading,
    error,
    mutate,
  };
}
