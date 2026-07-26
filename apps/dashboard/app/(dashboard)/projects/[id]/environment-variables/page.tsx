"use client";

import { useParams } from "next/navigation";
import { EnvVariablesCard } from "@/components/projects/env-variables-card";

export default function ProjectEnvironmentVariablesPage() {
  const params = useParams<{ id: string }>();
  return <EnvVariablesCard projectId={params.id} />;
}
