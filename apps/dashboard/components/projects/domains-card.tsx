"use client";

import { useState } from "react";
import { CheckCircle, Clock, Trash, WarningCircle } from "@phosphor-icons/react";
import useSWR from "swr";
import { api, ApiError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Domain, DomainStatus } from "@/lib/types";

interface DomainsCardProps {
  projectId: string;
}

const STATUS_CONFIG: Record<DomainStatus, { label: string; className: string; icon: typeof Clock }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  active: {
    label: "Active",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    icon: CheckCircle,
  },
  error: {
    label: "Error",
    className: "bg-red-500/15 text-red-400 border-red-500/20",
    icon: WarningCircle,
  },
  deleted: {
    label: "Removed",
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
    icon: WarningCircle,
  },
};

function DomainStatusBadge({ status }: { status: DomainStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}

const CNAME_TARGET = process.env.NEXT_PUBLIC_FLEET_DOMAIN_CNAME_TARGET;

/**
 * Two separate DNS records are required, and it's easy to add only one:
 * a routing CNAME (makes the domain resolve at all, via Cloudflare's edge)
 * and an ownership-verification record (proves control, unlocks the cert).
 * Cloudflare reports the hostname "active" once ownership + SSL are done —
 * that does NOT mean the routing CNAME exists, so show both unconditionally.
 */
function RoutingRecord({ domain }: { domain: string }) {
  if (!CNAME_TARGET) return null;
  return (
    <div className="mt-2 rounded-lg border border-border bg-[var(--bg-elevated)] p-3 font-mono text-xs">
      <p className="text-muted-foreground">
        1. Add this CNAME record at your DNS provider (this makes the domain
        resolve — without it, the domain will not load even once verified):
      </p>
      <p className="mt-1 break-all">
        <span className="text-muted-foreground">Name: </span>
        {domain}
      </p>
      <p className="mt-1 break-all">
        <span className="text-muted-foreground">Value: </span>
        {CNAME_TARGET}
      </p>
    </div>
  );
}

function VerificationRecord({ domain }: { domain: Domain }) {
  const record = domain.ownershipVerification;
  if (!record) return null;

  // Cloudflare returns either a DNS record (type/name/value) or an HTTP
  // challenge (http_url/http_body) depending on the hostname's ssl settings.
  if (record.name && record.value) {
    return (
      <div className="mt-2 rounded-lg border border-border bg-[var(--bg-elevated)] p-3 font-mono text-xs">
        <p className="text-muted-foreground">
          2. Add this {record.type ?? "TXT"} record to verify ownership:
        </p>
        <p className="mt-1 break-all">
          <span className="text-muted-foreground">Name: </span>
          {record.name}
        </p>
        <p className="mt-1 break-all">
          <span className="text-muted-foreground">Value: </span>
          {record.value}
        </p>
      </div>
    );
  }

  if (record.http_url) {
    return (
      <div className="mt-2 rounded-lg border border-border bg-[var(--bg-elevated)] p-3 font-mono text-xs">
        <p className="text-muted-foreground">
          2. Cloudflare is verifying ownership via HTTP at:
        </p>
        <p className="mt-1 break-all">{record.http_url}</p>
      </div>
    );
  }

  return null;
}

/**
 * The certificate itself needs separate DV validation from hostname
 * ownership — Cloudflare can list more than one (it tries multiple CAs).
 * Add all of them; only one needs to resolve for the cert to issue.
 */
function SslValidationRecords({ domain }: { domain: Domain }) {
  const records = domain.sslValidationRecords?.filter((r) => r.txt_name && r.txt_value);
  if (!records || records.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-border bg-[var(--bg-elevated)] p-3 font-mono text-xs">
      <p className="text-muted-foreground">
        3. Add this TXT record so the SSL certificate can be issued (add any
        one if multiple are listed):
      </p>
      {records.map((record, i) => (
        <div key={i} className={i > 0 ? "mt-3 border-t border-border pt-3" : ""}>
          <p className="mt-1 break-all">
            <span className="text-muted-foreground">Name: </span>
            {record.txt_name}
          </p>
          <p className="mt-1 break-all">
            <span className="text-muted-foreground">Value: </span>
            {record.txt_value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function DomainsCard({ projectId }: DomainsCardProps) {
  const { data: domains, isLoading, mutate } = useSWR<Domain[]>(
    `project-domains-${projectId}`,
    () => api.getProjectDomains(projectId),
    {
      refreshInterval: (latestData) => {
        const hasPending = latestData?.some((d) => d.status === "pending");
        return hasPending ? 5000 : 0;
      },
    },
  );

  const [newDomain, setNewDomain] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    const domain = newDomain.trim().toLowerCase();
    if (!domain) return;

    setError(null);
    setIsAdding(true);
    try {
      await api.addProjectDomain(projectId, domain);
      setNewDomain("");
      await mutate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add domain.");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleVerifyNow(domainId: string) {
    setError(null);
    setCheckingId(domainId);
    try {
      await api.verifyProjectDomain(projectId, domainId);
      await mutate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to check domain status.");
    } finally {
      setCheckingId(null);
    }
  }

  async function handleRemove(domainId: string) {
    setError(null);
    setRemovingId(domainId);
    try {
      await api.deleteProjectDomain(projectId, domainId);
      await mutate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove domain.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Custom Domains</CardTitle>
        <CardDescription>
          Point your own domain at this project. Add a domain, then create the
          DNS record shown below at your registrar.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        {isLoading ? (
          <div className="h-9 animate-pulse rounded-lg bg-muted" />
        ) : domains && domains.length > 0 ? (
          domains.map((domain) => (
            <div
              key={domain._id}
              className="rounded-lg border border-border p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{domain.domain}</span>
                <div className="flex items-center gap-2">
                  <DomainStatusBadge status={domain.status} />
                  {domain.status === "pending" && (
                    <Button
                      variant="outline"
                      size="xs"
                      disabled={checkingId === domain._id}
                      onClick={() => handleVerifyNow(domain._id)}
                    >
                      {checkingId === domain._id ? "Checking…" : "Check now"}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={removingId === domain._id}
                    onClick={() => handleRemove(domain._id)}
                  >
                    <Trash className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/*
                RoutingRecord stays visible even once "active" — Cloudflare's
                active status only means ownership+SSL passed, not that the
                routing CNAME exists. A domain can be "active" here and still
                not resolve at all if that CNAME was never added.
              */}
              {(domain.status === "pending" || domain.status === "active") && (
                <RoutingRecord domain={domain.domain} />
              )}
              {domain.status === "pending" && (
                <>
                  <VerificationRecord domain={domain} />
                  <SslValidationRecords domain={domain} />
                </>
              )}

              {domain.status === "error" && domain.error && (
                <p className="mt-2 text-xs text-destructive">{domain.error}</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No custom domains connected yet.
          </p>
        )}

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Input
          placeholder="app.example.com"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          disabled={isAdding}
        />
        <Button onClick={handleAdd} disabled={isAdding || !newDomain.trim()} size="sm">
          {isAdding ? "Adding…" : "Add domain"}
        </Button>
      </CardFooter>
    </Card>
  );
}
