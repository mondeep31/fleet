"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { EnvVariableEditor } from "./env-variable-editor";
import type { EnvVariableRow } from "@/lib/types";

const projectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  repoUrl: z.url("Enter a valid repository URL"),
});

type ProjectForm = z.infer<typeof projectSchema>;

export function NewProjectDialog({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variables, setVariables] = useState<EnvVariableRow[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", repoUrl: "" },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset();
      setVariables([]);
      setError(null);
    }
  }

  async function onSubmit(values: ProjectForm) {
    setError(null);

    const validVariables = variables.filter((v) => v.key.trim() !== "");
    const keys = validVariables.map((v) => v.key.trim());
    if (keys.length !== new Set(keys).size) {
      setError("Environment variables contain duplicate keys.");
      return;
    }

    try {
      await api.createProject(values.name, values.repoUrl, validVariables);
      reset();
      setVariables([]);
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to create project. Check the repository URL and try again.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="size-4" weight="bold" />
            New Project
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            Connect a Git repository. Fleet will clone, build, and deploy it
            automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="my-app"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="repo-url">Repository URL</Label>
            <Input
              id="repo-url"
              placeholder="https://github.com/org/repo"
              aria-invalid={Boolean(errors.repoUrl)}
              {...register("repoUrl")}
            />
            {errors.repoUrl && (
              <p className="text-sm text-destructive">{errors.repoUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Environment Variables</Label>
            <p className="text-xs text-muted-foreground">
              Injected at runtime — available as <code>process.env.KEY</code> in your app.
            </p>
            <EnvVariableEditor
              rows={variables}
              onChange={setVariables}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating…" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
