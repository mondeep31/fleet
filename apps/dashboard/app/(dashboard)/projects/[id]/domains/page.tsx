"use client";

import { useParams } from "next/navigation";
import { DomainsCard } from "@/components/projects/domains-card";

export default function ProjectDomainsPage() {
  const params = useParams<{ id: string }>();
  return <DomainsCard projectId={params.id} />;
}
