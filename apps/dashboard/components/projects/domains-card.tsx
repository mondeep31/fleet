"use client";

import { useState } from "react";
import {
  ArrowSquareOut,
  CheckCircle,
  CircleNotch,
  Clock,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import useSWR from "swr";
import { api, ApiError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDnsResolves } from "@/hooks/use-dns-resolves";
import { cn } from "@/lib/utils";
import type { Domain, DomainStatus } from "@/lib/types";

interface DomainsCardProps {
  projectId: string;
}

const STATUS_CONFIG: Record<
  DomainStatus,
  { label: string; className: string; icon: typeof Clock }
> = {
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

function DnsRecordLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="mt-1 flex items-center gap-1.5">
      <span className="shrink-0 text-muted-foreground">{label}: </span>
      <span className="min-w-0 flex-1 break-all">{value}</span>
      <CopyButton value={value} />
    </p>
  );
}

/**
 * One row of the per-domain setup checklist. Instructions collapse once
 * `done` — the point is to always show overall progress (not hide everything
 * until fully done, and not show everything at once with no sense of what's
 * left), and to distinguish "still waiting on you" from "actively checking"
 * so a check-in-progress doesn't read the same as a stalled pending state.
 */
function ChecklistItem({
  done,
  checking,
  label,
  children,
}: {
  done: boolean;
  checking?: boolean;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-3 first:mt-0">
      <div className="flex items-center gap-2 text-sm">
        {checking ? (
          <CircleNotch className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : done ? (
          <CheckCircle className="size-4 shrink-0 text-emerald-400" />
        ) : (
          <Clock className="size-4 shrink-0 text-amber-400" />
        )}
        <span className={cn(done && "text-muted-foreground")}>{label}</span>
      </div>
      {!done && children && (
        <div className="mt-1 ml-6 rounded-lg border border-border bg-[var(--bg-elevated)] p-3 font-mono text-xs">
          {children}
        </div>
      )}
    </div>
  );
}

function RoutingRecordContent({ domain }: { domain: string }) {
  if (!CNAME_TARGET) return null;
  return (
    <>
      <p className="text-muted-foreground">
        Add this CNAME record at your DNS provider — without it, the domain will
        not load even once verified:
      </p>
      <DnsRecordLine label="Name" value={domain} />
      <DnsRecordLine label="Value" value={CNAME_TARGET} />
    </>
  );
}

function VerificationRecordContent({ domain }: { domain: Domain }) {
  const record = domain.ownershipVerification;
  if (!record) return null;

  // Cloudflare returns either a DNS record (type/name/value) or an HTTP
  // challenge (http_url/http_body) depending on the hostname's ssl settings.
  if (record.name && record.value) {
    return (
      <>
        <p className="text-muted-foreground">
          Add this {record.type ?? "TXT"} record to verify ownership:
        </p>
        <DnsRecordLine label="Name" value={record.name} />
        <DnsRecordLine label="Value" value={record.value} />
      </>
    );
  }

  if (record.http_url) {
    return (
      <>
        <p className="text-muted-foreground">
          Cloudflare is verifying ownership via HTTP at:
        </p>
        <DnsRecordLine label="URL" value={record.http_url} />
      </>
    );
  }

  return null;
}

/**
 * The certificate itself needs separate DV validation from hostname
 * ownership — Cloudflare can list more than one (it tries multiple CAs).
 * Add all of them; only one needs to resolve for the cert to issue.
 */
function SslValidationRecordsContent({ domain }: { domain: Domain }) {
  const records = domain.sslValidationRecords?.filter(
    (r): r is { txt_name: string; txt_value: string } =>
      Boolean(r.txt_name && r.txt_value),
  );
  if (!records || records.length === 0) return null;

  return (
    <>
      <p className="text-muted-foreground">
        Add this TXT record so the SSL certificate can be issued (add any one if
        multiple are listed):
      </p>
      {records.map((record, i) => (
        <div
          key={i}
          className={i > 0 ? "mt-3 border-t border-border pt-3" : ""}
        >
          <DnsRecordLine label="Name" value={record.txt_name} />
          <DnsRecordLine label="Value" value={record.txt_value} />
        </div>
      ))}
    </>
  );
}

function DomainChecklist({
  domain,
  checkingNow,
}: {
  domain: Domain;
  checkingNow: boolean;
}) {
  const { resolves: routingDone, checking: routingChecking } = useDnsResolves(
    domain.domain,
    Boolean(CNAME_TARGET),
  );
  const ownershipDone = domain.hostnameStatus === "active";
  const certDone = domain.sslStatus === "active";

  return (
    <div className="mt-3">
      {CNAME_TARGET && (
        <ChecklistItem
          done={routingDone}
          checking={routingChecking}
          label="Domain resolves (routing CNAME)"
        >
          {RoutingRecordContent({ domain: domain.domain })}
        </ChecklistItem>
      )}
      <ChecklistItem
        done={ownershipDone}
        checking={checkingNow && !ownershipDone}
        label="Ownership verified"
      >
        {VerificationRecordContent({ domain })}
      </ChecklistItem>
      <ChecklistItem
        done={certDone}
        checking={checkingNow && !certDone}
        label="SSL certificate issued"
      >
        {SslValidationRecordsContent({ domain })}
      </ChecklistItem>
    </div>
  );
}

export function DomainsCard({ projectId }: DomainsCardProps) {
  const {
    data: domains,
    isLoading,
    mutate,
  } = useSWR<Domain[]>(
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
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to check domain status.",
      );
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
      setError(
        err instanceof ApiError ? err.message : "Failed to remove domain.",
      );
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
          domains.map((domain) => {
            // Not domain.status === "active" — that's a coarser summary and
            // can lag behind these two specific fields (e.g. a field added
            // after a domain was already active, never backfilled since the
            // sweep only revisits "pending" domains). Check the actual
            // fields the button would refresh, so it only disappears once
            // there is genuinely nothing left to check.
            const fullyVerified =
              domain.hostnameStatus === "active" &&
              domain.sslStatus === "active";

            return (
              <div
                key={domain._id}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{domain.domain}</span>
                  <div className="flex items-center gap-2">
                    <DomainStatusBadge status={domain.status} />
                    {domain.status === "active" && (
                      <a
                        href={`https://${domain.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${domain.domain}`}
                        className="flex size-6 shrink-0 items-center justify-center rounded-[min(var(--radius-md),10px)] text-muted-foreground transition-colors hover:bg-[var(--bg-elevated)] hover:text-foreground"
                      >
                        <ArrowSquareOut className="size-3.5" />
                      </a>
                    )}
                    {domain.status !== "error" && !fullyVerified && (
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

                {domain.status !== "error" && (
                  <DomainChecklist
                    domain={domain}
                    checkingNow={checkingId === domain._id}
                  />
                )}

                {domain.status === "error" && domain.error && (
                  <p className="mt-2 text-xs text-destructive">
                    {domain.error}
                  </p>
                )}
              </div>
            );
          })
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

      {domains && domains.length > 0 ? (
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Only one custom domain is allowed per project — remove the
            existing one above to connect a different domain.
          </p>
        </CardFooter>
      ) : (
        <CardFooter className="gap-2">
          <Input
            placeholder="app.example.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            disabled={isAdding}
          />
          <Button
            onClick={handleAdd}
            disabled={isAdding || !newDomain.trim()}
            size="sm"
          >
            {isAdding ? "Adding…" : "Add domain"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
