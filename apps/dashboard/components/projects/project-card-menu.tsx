"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowCounterClockwise,
  DotsThree,
  Play,
  Stop,
  Trash,
} from "@phosphor-icons/react";
import { toast } from "sonner";
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

function canRedeployDeployment(deployment?: Deployment): boolean {
  return deployment?.status === "live";
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
    "stop" | "start" | "redeploy" | "archive" | null
  >(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const showStop = canStopDeployment(latestDeployment);
  const showStart = canStartDeployment(latestDeployment);
  const showRedeploy = canRedeployDeployment(latestDeployment);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function updatePosition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  async function handleStop() {
    if (!latestDeployment) return;
    setLoading("stop");
    try {
      await api.stopDeployment(latestDeployment.deploymentId);
      setOpen(false);
      onChanged();
    } catch (err) {
      toast.error(
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
    try {
      await api.startProjectDeployment(projectId);
      setOpen(false);
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Failed to start deployment. Try again.",
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleRedeploy() {
    setLoading("redeploy");
    try {
      await api.startProjectDeployment(projectId);
      setOpen(false);
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Failed to start redeploy. Try again.",
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleArchive() {
    setLoading("archive");
    try {
      await api.archiveProject(projectId);
      setConfirmOpen(false);
      setOpen(false);
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Failed to delete project. Try again.",
      );
    } finally {
      setLoading(null);
    }
  }

  const menu =
    open &&
    createPortal(
      <div
        ref={menuRef}
        role="menu"
        style={{
          position: "fixed",
          top: menuPosition.top,
          right: menuPosition.right,
          zIndex: 50,
        }}
        className="min-w-44 overflow-hidden rounded-2xl border border-border bg-white p-1 shadow-[0_18px_48px_-24px_rgba(18,28,23,.38)]"
        onClick={(event) => event.stopPropagation()}
      >
        {showStop && (
          <Button
            variant="ghost"
            size="sm"
            disabled={loading !== null}
            className="h-9 w-full justify-start gap-2 rounded-xl bg-transparent px-3 text-sm text-muted-foreground shadow-none hover:bg-[var(--bg-inset)] hover:text-foreground"
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
        {showRedeploy && (
          <Button
            variant="ghost"
            size="sm"
            disabled={loading !== null}
            className="h-9 w-full justify-start gap-2 rounded-xl bg-transparent px-3 text-sm text-muted-foreground shadow-none hover:bg-[var(--bg-inset)] hover:text-foreground"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void handleRedeploy();
            }}
          >
            <ArrowCounterClockwise className="size-4" />
            Redeploy
          </Button>
        )}
        {showStart && (
          <Button
            variant="ghost"
            size="sm"
            disabled={loading !== null}
            className="h-9 w-full justify-start gap-2 rounded-xl bg-transparent px-3 text-sm text-muted-foreground shadow-none hover:bg-[var(--bg-inset)] hover:text-foreground"
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
          className="h-9 w-full justify-start gap-2 rounded-xl bg-transparent px-3 text-sm text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive"
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
      </div>,
      document.body,
    );

  return (
    <>
      <div className="relative" ref={containerRef}>
        <button
          ref={triggerRef}
          type="button"
          aria-label="Project actions"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen((current) => !current);
          }}
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-[var(--bg-inset)] text-muted-foreground transition-colors hover:bg-[var(--bg-elevated)] hover:text-foreground",
            open && "border-border bg-[var(--bg-elevated)] text-foreground",
          )}
        >
          <DotsThree className="size-4 shrink-0" weight="bold" />
        </button>
      </div>

      {menu}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              This permanently archives the project and stops all running
              deployments. Archived projects cannot be restored.
            </DialogDescription>
          </DialogHeader>
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
