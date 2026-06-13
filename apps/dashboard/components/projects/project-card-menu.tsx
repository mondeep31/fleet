"use client";

import { useEffect, useRef, useState } from "react";
import {
  DotsThree,
  Play,
  Stop,
  Trash,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Deployment, DeploymentStatus } from "@/lib/types";

const IN_PROGRESS_STATUSES: DeploymentStatus[] = [
  "queued",
  "cloning",
  "cloned",
  "building",
  "deploying",
];

const REDEPLOYABLE_STATUSES: DeploymentStatus[] = [
  "deleted",
  "stopped",
  "failed",
  "rolled_back",
];

function canStopDeployment(deployment?: Deployment): boolean {
  if (!deployment) return false;
  return (
    deployment.status === "live" ||
    IN_PROGRESS_STATUSES.includes(deployment.status)
  );
}

function canStartDeployment(deployment?: Deployment): boolean {
  if (!deployment) return true;
  if (IN_PROGRESS_STATUSES.includes(deployment.status)) return false;
  if (deployment.status === "live") return false;
  return REDEPLOYABLE_STATUSES.includes(deployment.status);
}

export function ProjectCardMenu({
  projectId,
  latestDeployment,
  onChanged,
}: {
  projectId: string;
  latestDeployment?: Deployment;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState<
    "stop" | "start" | "archive" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const showStop = canStopDeployment(latestDeployment);
  const showStart = canStartDeployment(latestDeployment);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  async function handleStop() {
    if (!latestDeployment) return;
    setLoading("stop");
    setError(null);
    try {
      await api.stopDeployment(latestDeployment.deploymentId);
      setOpen(false);
      onChanged();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to stop deployment. Try again.",
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleStart() {
    setLoading("start");
    setError(null);
    try {
      await api.startProjectDeployment(projectId);
      setOpen(false);
      onChanged();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to start deployment. Try again.",
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleArchive() {
    setLoading("archive");
    setError(null);
    try {
      await api.archiveProject(projectId);
      setConfirmOpen(false);
      setOpen(false);
      onChanged();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to delete project. Try again.",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        {open && (
          <div className="absolute right-0 top-[calc(100%+0.25rem)] z-20 min-w-44 overflow-hidden rounded-lg border border-border bg-[var(--bg-elevated)] py-1 shadow-[0_18px_48px_-24px_rgba(0,0,0,0.8)]">
            {showStop && (
              <Button
                variant="ghost"
                size="sm"
                disabled={loading !== null}
                className="h-9 w-full justify-start gap-2 rounded-none bg-transparent px-3 text-sm text-muted-foreground shadow-none hover:bg-[var(--bg-inset)] hover:text-foreground"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void handleStop();
                }}
              >
                <Stop className="size-4" />
                Stop deployment
              </Button>
            )}
            {showStart && (
              <Button
                variant="ghost"
                size="sm"
                disabled={loading !== null}
                className="h-9 w-full justify-start gap-2 rounded-none bg-transparent px-3 text-sm text-muted-foreground shadow-none hover:bg-[var(--bg-inset)] hover:text-foreground"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void handleStart();
                }}
              >
                <Play className="size-4" />
                Start deployment
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              disabled={loading !== null}
              className="h-9 w-full justify-start gap-2 rounded-none bg-transparent px-3 text-sm text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setConfirmOpen(true);
                setOpen(false);
              }}
            >
              <Trash className="size-4" />
              Delete project
            </Button>
            {error && !confirmOpen && (
              <p className="px-3 py-2 text-xs text-destructive">{error}</p>
            )}
          </div>
        )}

        <button
          type="button"
          aria-label="Project actions"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen((current) => !current);
            setError(null);
          }}
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-[var(--bg-inset)] text-muted-foreground transition-colors hover:bg-[var(--bg-elevated)] hover:text-foreground",
            open && "border-border bg-[var(--bg-elevated)] text-foreground",
          )}
        >
          <DotsThree className="size-4 shrink-0" weight="bold" />
        </button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              This permanently archives the project and stops all running
              deployments. Archived projects cannot be restored.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={loading === "archive"}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleArchive()}
              disabled={loading === "archive"}
            >
              {loading === "archive" ? "Deleting…" : "Delete project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
