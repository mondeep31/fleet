"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EnvVariableEditor } from "./env-variable-editor";
import type { EnvVariableRow } from "@/lib/types";

interface EnvVariablesCardProps {
  projectId: string;
  onDeployStarted?: () => void;
}

export function EnvVariablesCard({ projectId, onDeployStarted }: EnvVariablesCardProps) {
  const { data, isLoading, mutate } = useSWR(
    `project-variables-${projectId}`,
    () => api.getProjectVariables(projectId),
  );

  const [rows, setRows] = useState<EnvVariableRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialise rows from server data. hasExistingValue=true means the value is
  // already encrypted server-side; the UI shows a masked placeholder.
  useEffect(() => {
    if (data?.variables) {
      setRows(
        data.variables.map((v) => ({
          key: v.key,
          value: "",
          hasExistingValue: v.hasValue,
        })),
      );
    }
  }, [data]);

  async function handleSave() {
    const validRows = rows.filter((r) => r.key.trim() !== "");
    const keys = validRows.map((r) => r.key.trim());
    if (keys.length !== new Set(keys).size) {
      toast.error("Duplicate keys are not allowed.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await api.updateProjectVariables(projectId, validRows);
      await mutate();

      if (result.redeploy.started) {
        toast.success("Variables saved — redeploy started.");
        onDeployStarted?.();
      } else {
        toast.message(
          result.redeploy.reason?.includes("in progress")
            ? "Variables saved. A deployment is already in progress — it will use these values."
            : "Variables saved. Redeploy manually to apply them to the live app.",
        );
      }
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Failed to save variables. Try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Environment Variables</CardTitle>
        <CardDescription>
          Injected at container start as runtime environment variables. Saving
          automatically triggers a redeploy.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-2">
                <div className="h-9 flex-1 animate-pulse rounded-lg bg-muted" />
                <div className="h-9 flex-1 animate-pulse rounded-lg bg-muted" />
                <div className="size-7 animate-pulse rounded-lg bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <EnvVariableEditor
            rows={rows}
            onChange={setRows}
            disabled={isSaving}
          />
        )}
      </CardContent>

      <CardFooter className="justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          size="sm"
        >
          {isSaving ? "Saving…" : "Save & redeploy"}
        </Button>
      </CardFooter>
    </Card>
  );
}
