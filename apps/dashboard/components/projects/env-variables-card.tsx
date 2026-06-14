"use client";

import { useState, useEffect } from "react";
import { Info } from "@phosphor-icons/react";
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
  onRedeployNeeded?: () => void;
}

export function EnvVariablesCard({ projectId, onRedeployNeeded }: EnvVariablesCardProps) {
  const { data, isLoading, mutate } = useSWR(
    `project-variables-${projectId}`,
    () => api.getProjectVariables(projectId),
  );

  const [rows, setRows] = useState<EnvVariableRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Initialise rows from fetched data. Existing saved variables show key only
  // (value is masked server-side); new rows the user adds have a blank value.
  useEffect(() => {
    if (data?.variables) {
      setRows(
        data.variables.map((v) => ({
          key: v.key,
          value: "",
        })),
      );
    }
  }, [data]);

  async function handleSave() {
    setError(null);
    setSaved(false);

    const validRows = rows.filter((r) => r.key.trim() !== "");
    const keys = validRows.map((r) => r.key.trim());
    if (keys.length !== new Set(keys).size) {
      setError("Duplicate keys are not allowed.");
      return;
    }

    setIsSaving(true);
    try {
      await api.updateProjectVariables(projectId, validRows);
      await mutate();
      setSaved(true);
      onRedeployNeeded?.();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to save variables. Try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const hasChanges = !isLoading;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Environment Variables</CardTitle>
        <CardDescription>
          Injected at container start as runtime environment variables.
          Changes take effect on the next deployment.
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
            onChange={(next) => {
              setRows(next);
              setSaved(false);
            }}
            disabled={isSaving}
          />
        )}

        {error && (
          <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {saved && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-[var(--bg-elevated)] px-3 py-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>
              Variables saved. Redeploy the project to apply them to the live app.
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || isLoading || !hasChanges}
          size="sm"
        >
          {isSaving ? "Saving…" : "Save variables"}
        </Button>
      </CardFooter>
    </Card>
  );
}
