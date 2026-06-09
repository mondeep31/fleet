"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowSquareOut, Trash } from "@phosphor-icons/react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableCell, TableRow } from "@/components/ui/table";
import { api, ApiError } from "@/lib/api";
import {
  formatDuration,
  formatRelativeTime,
  truncateId,
} from "@/lib/format";
import type { Deployment } from "@/lib/types";

export function DeploymentRow({
  deployment,
  onStopped,
}: {
  deployment: Deployment;
  onStopped: () => void;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canStop =
    deployment.status !== "stopped" &&
    deployment.status !== "live" &&
    deployment.status !== "failed";

  async function handleStop() {
    setStopping(true);
    setError(null);
    try {
      await api.stopDeployment(deployment.deploymentId);
      setConfirmOpen(false);
      onStopped();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to stop deployment. Try again.",
      );
    } finally {
      setStopping(false);
    }
  }

  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={() =>
          router.push(`/deployments/${deployment.deploymentId}`)
        }
      >
        <TableCell>
          <div className="flex items-center gap-2">
            <StatusBadge status={deployment.status} />
            <span className="font-mono text-xs text-muted-foreground">
              {truncateId(deployment.deploymentId)}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {deployment.branch}
        </TableCell>
        <TableCell className="text-muted-foreground">
          {formatRelativeTime(deployment.createdAt)}
        </TableCell>
        <TableCell className="tabular-nums text-muted-foreground">
          {formatDuration(deployment.createdAt, deployment.updatedAt)}
        </TableCell>
        <TableCell>
          {deployment.url ? (
            <a
              href={deployment.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              Open
              <ArrowSquareOut className="size-3.5" />
            </a>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell>
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href={`/deployments/${deployment.deploymentId}`}
              className="inline-flex h-7 items-center rounded-lg bg-[var(--bg-elevated)] px-2.5 text-sm text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Logs
            </Link>
            {canStop && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Stop deployment"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Stop Deployment</DialogTitle>
            <DialogDescription>
              This will cancel the build pipeline and remove the running
              container. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={stopping}
              onClick={handleStop}
            >
              {stopping ? "Stopping…" : "Stop Deployment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
