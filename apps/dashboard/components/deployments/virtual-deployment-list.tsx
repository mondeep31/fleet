"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DeploymentRow } from "@/components/deployments/deployment-row";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Deployment } from "@/lib/types";

const VIRTUAL_THRESHOLD = 50;

export function VirtualDeploymentList({
  deployments,
  onStopped,
}: {
  deployments: Deployment[];
  onStopped: () => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const useVirtual = deployments.length > VIRTUAL_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: deployments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 8,
    enabled: useVirtual,
  });

  if (!useVirtual) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Deploy time</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deployments.map((deployment) => (
              <DeploymentRow
                key={deployment.deploymentId}
                deployment={deployment}
                onStopped={onStopped}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  const items = virtualizer.getVirtualItems();

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Deploy time</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
      <div
        ref={parentRef}
        className="max-h-[calc(100dvh-220px)] overflow-auto scrollbar-thin scrollbar-track-[#101817] scrollbar-thumb-[#52635d] scrollbar-corner-[#101817] scrollbar-hover:scrollbar-thumb-[#72847d]"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {items.map((virtualRow) => {
            const deployment = deployments[virtualRow.index];
            return (
              <div
                key={deployment.deploymentId}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <Table>
                  <TableBody>
                    <DeploymentRow
                      deployment={deployment}
                      onStopped={onStopped}
                    />
                  </TableBody>
                </Table>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
