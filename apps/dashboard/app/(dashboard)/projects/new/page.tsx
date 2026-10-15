"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowLeft,
  CaretRight,
  CheckCircle,
  MagnifyingGlass,
  SpinnerGap,
  XCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnvVariableEditor } from "@/components/projects/env-variable-editor";
import { api, ApiError } from "@/lib/api";
import type {
  DockerfileValidation,
  EnvVariableRow,
  GitHubRepo,
  GitHubStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Step = "repo" | "details";

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function RepoRow({
  repo,
  selected,
  onSelect,
}: {
  repo: GitHubRepo;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
        selected
          ? "bg-primary text-primary-foreground"
          : "hover:bg-[var(--bg-elevated)] text-foreground",
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-medium">{repo.full_name}</p>
        {repo.description && (
          <p
            className={cn(
              "truncate text-xs",
              selected ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            {repo.description}
          </p>
        )}
      </div>
      {repo.private && (
        <span
          className={cn(
            "ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs",
            selected
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-[var(--bg-elevated)] text-muted-foreground",
          )}
        >
          Private
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NewProjectPage() {
  const router = useRouter();

  const { data: githubStatus } = useSWR<GitHubStatus>(
    "github-status",
    () => api.getGitHubStatus(),
    { revalidateOnFocus: false },
  );

  const [step, setStep] = useState<Step>("repo");

  // ── Repos ────────────────────────────────────────────────────────────────
  // Page 1 via SWR; additional pages accumulated on demand.
  const {
    data: firstPageRepos,
    isLoading: firstPageLoading,
    error: firstPageError,
  } = useSWR<GitHubRepo[]>(
    githubStatus?.connected ? "github-repos-p1" : null,
    () => api.listGitHubRepos({ page: 1, per_page: 30 }),
    { revalidateOnFocus: false },
  );
  const [extraRepos, setExtraRepos] = useState<GitHubRepo[]>([]);
  const [morePage, setMorePage] = useState(2);
  const [lastBatchFull, setLastBatchFull] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  const allRepos = [...(firstPageRepos ?? []), ...extraRepos];
  const hasMore =
    !firstPageLoading &&
    (firstPageRepos?.length ?? 0) > 0 &&
    (morePage === 2 ? (firstPageRepos?.length ?? 0) === 30 : lastBatchFull);

  const reposError = firstPageError
    ? firstPageError instanceof ApiError
      ? firstPageError.message
      : "Failed to load repos"
    : null;

  // ── Search ───────────────────────────────────────────────────────────────
  // Debounce the user's input; SWR key includes the query for server-side search.
  const [repoQuery, setRepoQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(repoQuery.trim()), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [repoQuery]);

  const trimmedQuery = repoQuery.trim();
  const isSearchActive = trimmedQuery.length > 0;
  const isDebouncing = isSearchActive && trimmedQuery !== debouncedQuery;
  const isSearching = debouncedQuery.length > 0;
  const {
    data: searchResults,
    isLoading: searchLoading,
    isValidating: searchValidating,
    error: searchError,
  } = useSWR<GitHubRepo[]>(
    githubStatus?.connected && isSearching
      ? `github-search:${debouncedQuery}`
      : null,
    () => api.listGitHubRepos({ q: debouncedQuery, per_page: 30 }),
    { revalidateOnFocus: false },
  );

  const searchErrorMessage = searchError
    ? searchError instanceof ApiError
      ? searchError.message
      : "Failed to search repositories"
    : null;

  const searchFetching = isSearching && (searchLoading || searchValidating);

  // When searching show search results, otherwise show paginated repos.
  const visibleRepos =
    isSearchActive && (isDebouncing || searchFetching)
      ? []
      : isSearchActive
        ? (searchResults ?? [])
        : allRepos;
  const listLoading =
    isDebouncing ||
    searchFetching ||
    (!isSearchActive && firstPageLoading && allRepos.length === 0);

  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);

  // ── Branches via SWR ────────────────────────────────────────────────────
  const { data: branches, isLoading: branchesLoading } = useSWR(
    selectedRepo ? `github-branches:${selectedRepo.full_name}` : null,
    () => {
      const [owner, repo] = selectedRepo!.full_name.split("/");
      return api.listGitHubBranches(owner, repo);
    },
    { revalidateOnFocus: false },
  );
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  // ── Dockerfile validation ────────────────────────────────────────────────
  // Debounced effect — all setState calls happen inside the async timeout
  // callback so none are synchronous in the effect body.
  const [validation, setValidation] = useState<DockerfileValidation | null>(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (!selectedRepo || !selectedBranch) return;
    const owner = selectedRepo.full_name.split("/")[0];
    const repo = selectedRepo.full_name.split("/")[1];
    const branch = selectedBranch;

    const timeoutId = setTimeout(async () => {
      setValidation(null);
      setValidating(true);
      try {
        const result = await api.validateGitHubRepo(owner, repo, branch);
        setValidation(result);
      } catch {
        setValidation({ ok: false, reason: "Failed to check Dockerfile" });
      } finally {
        setValidating(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [selectedRepo, selectedBranch]);

  // ── Details ──────────────────────────────────────────────────────────────
  const [projectName, setProjectName] = useState("");
  const [envVars, setEnvVars] = useState<EnvVariableRow[]>([]);
  const [creating, setCreating] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function loadMoreRepos() {
    setLoadMoreLoading(true);
    try {
      const fetched = await api.listGitHubRepos({ page: morePage, per_page: 30 });
      setExtraRepos((prev) => [...prev, ...fetched]);
      setLastBatchFull(fetched.length === 30);
      setMorePage((p) => p + 1);
    } catch {
      // silently ignore — user can retry
    } finally {
      setLoadMoreLoading(false);
    }
  }

  function handleRepoSelect(repo: GitHubRepo) {
    setSelectedRepo(repo);
    setProjectName(repo.name);
    // Set branch to repo default; validation resets via the useEffect above.
    setSelectedBranch(repo.default_branch);
    setValidation(null);
    setValidating(false);
  }

  function handleContinue() {
    if (!selectedRepo || !selectedBranch || !validation?.ok) return;
    setStep("details");
  }

  async function handleCreate() {
    if (!selectedRepo || !selectedBranch || !validation?.ok) return;
    setCreating(true);
    try {
      const repoUrl = `https://github.com/${selectedRepo.full_name}`;
      const result = await api.createProject(projectName, repoUrl, selectedBranch, envVars);
      router.push(`/projects/${result.projectId}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to create project";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Not connected
  // ---------------------------------------------------------------------------
  if (githubStatus && !githubStatus.connected) {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <Header
          title="New Project"
          breadcrumbs={[{ label: "Projects", href: "/projects" }, { label: "New" }]}
        />
        <div className="dashboard-container flex flex-1 flex-col items-center justify-center px-4 py-16 text-center md:px-8">
          <div className="max-w-sm rounded-lg border border-border bg-card p-8">
            <p className="text-base font-medium">Connect GitHub to continue</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose the repositories Fleet can read and deploy. Repository
              access is separate from signing in.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button render={<a href="/api/integrations/github/connect" />} nativeButton={false}>
                Connect GitHub
              </Button>
              <Button variant="outline" render={<Link href="/connections" />} nativeButton={false}>
                Manage Connections
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Step: repo
  // ---------------------------------------------------------------------------
  if (step === "repo") {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <Header
          title="New Project"
          breadcrumbs={[{ label: "Projects", href: "/projects" }, { label: "New" }]}
        />

        <div className="dashboard-container flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-2xl space-y-5 rounded-lg border border-border bg-card p-5 sm:p-7">
            {/* Repo search */}
            <div>
              <Label htmlFor="repo-search" className="mb-1.5 block text-sm font-medium">
                Repository
              </Label>
              {githubStatus?.fineGrained && (
                <p className="mb-3 text-xs text-muted-foreground">
                  Only repositories you have granted Fleet access to appear here.{" "}
                  <a href="/api/integrations/github/connect" className="text-foreground underline underline-offset-4">
                    Manage repository access
                  </a>
                </p>
              )}
              <div className="relative">
                <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="repo-search"
                  value={repoQuery}
                  onChange={(e) => setRepoQuery(e.target.value)}
                  placeholder="Search repositories…"
                  className="pl-9 pr-9"
                />
                {(isDebouncing || searchFetching) && (
                  <SpinnerGap className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Repo list */}
            <div className="max-h-64 overflow-y-auto rounded-md border border-border bg-[#080808] p-1 scrollbar-thin scrollbar-track-[#080808] scrollbar-thumb-[#3f3f3f] scrollbar-corner-[#080808] hover:scrollbar-thumb-[#5a5a5a]">
              {listLoading && (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <SpinnerGap className="size-5 animate-spin" />
                  {isSearchActive ? "Searching repositories…" : "Loading repositories…"}
                </div>
              )}
              {reposError && !isSearching && (
                <div className="px-3 py-8 text-center">
                  <p className="text-sm text-destructive">{reposError}</p>
                  {reposError.includes("not connected") && (
                    <Button
                      render={<a href="/api/integrations/github/connect" />}
                      nativeButton={false}
                      size="sm"
                      className="mt-3"
                    >
                      Connect GitHub
                    </Button>
                  )}
                </div>
              )}
              {searchErrorMessage && isSearching && (
                <div className="px-3 py-8 text-center">
                  <p className="text-sm text-destructive">{searchErrorMessage}</p>
                </div>
              )}
              {!listLoading && !reposError && !searchErrorMessage && visibleRepos.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  {isSearching ? "No repositories match your search." : "No repositories found."}
                </p>
              )}
              {visibleRepos.map((repo) => (
                <RepoRow
                  key={repo.id}
                  repo={repo}
                  selected={selectedRepo?.id === repo.id}
                  onSelect={() => handleRepoSelect(repo)}
                />
              ))}
              {hasMore && !isSearchActive && (
                <button
                  type="button"
                  onClick={loadMoreRepos}
                  disabled={loadMoreLoading}
                  className="w-full rounded-md py-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {loadMoreLoading ? "Loading…" : "Load more"}
                </button>
              )}
            </div>

            {/* Branch selection */}
            {selectedRepo && (
              <div>
                <Label htmlFor="branch-select" className="mb-1.5 block text-sm font-medium">
                  Branch
                </Label>
                {branchesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <SpinnerGap className="size-4 animate-spin" />
                    Loading branches…
                  </div>
                ) : (
                  <Select
                    value={selectedBranch}
                    onValueChange={(v) => setSelectedBranch(v as string)}
                  >
                    <SelectTrigger
                      id="branch-select"
                      className="h-10 w-full data-[size=default]:h-10"
                    >
                      <SelectValue placeholder="Select a branch" />
                    </SelectTrigger>
                    <SelectContent
                      side="bottom"
                      align="start"
                      alignItemWithTrigger={false}
                      className="max-h-64 scrollbar-thin scrollbar-track-[#080808] scrollbar-thumb-[#3f3f3f] scrollbar-corner-[#080808] hover:scrollbar-thumb-[#5a5a5a]"
                    >
                      {branches?.map((b) => (
                        <SelectItem key={b.name} value={b.name}>
                          {b.name}
                          {b.name === selectedRepo.default_branch ? " (default)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Build method detection status */}
            {selectedRepo && selectedBranch && (
              <div className="rounded-md border border-border bg-[#0a0a0a] px-4 py-3 text-sm">
                {validating ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <SpinnerGap className="size-4 animate-spin" />
                    Checking build method…
                  </span>
                ) : validation?.ok && validation.buildMethod === "dockerfile" ? (
                  <span className="flex items-center gap-2 text-green-500">
                    <CheckCircle className="size-4" weight="fill" />
                    Dockerfile found at{" "}
                    <code className="font-mono text-xs">{validation.dockerfilePath}</code>
                  </span>
                ) : validation?.ok && validation.buildMethod === "railpack" ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="size-4" weight="fill" />
                    No Dockerfile — will use railpack for auto-detection
                  </span>
                ) : validation && !validation.ok ? (
                  <span className="flex items-center gap-2 text-destructive">
                    <XCircle className="size-4" weight="fill" />
                    {validation.reason}
                  </span>
                ) : null}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <Button variant="ghost" render={<Link href="/projects" />} nativeButton={false}>
                <ArrowLeft data-icon="inline-start" />
                Cancel
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!selectedRepo || !selectedBranch || !validation?.ok || validating}
              >
                Continue
                <CaretRight data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Step: details
  // ---------------------------------------------------------------------------
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header
        title="New Project"
        breadcrumbs={[{ label: "Projects", href: "/projects" }, { label: "New" }]}
      />

      <div className="dashboard-container flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-2xl space-y-6 rounded-lg border border-border bg-card p-5 sm:p-7">
          {/* Summary */}
          <div className="rounded-md border border-border bg-[#0a0a0a] px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">
                {selectedRepo?.full_name}
              </span>
              <span>·</span>
              <span className="font-mono">{selectedBranch}</span>
              <button
                type="button"
                onClick={() => setStep("repo")}
                className="ml-auto text-xs underline underline-offset-2 hover:text-foreground"
              >
                Change
              </button>
            </div>
          </div>

          {/* Project name */}
          <div>
            <Label htmlFor="project-name" className="mb-1.5 block text-sm font-medium">
              Project name
            </Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="my-project"
              autoFocus
            />
          </div>

          {/* Env vars */}
          <div>
            <p className="mb-2 text-sm font-medium">Environment variables</p>
            <EnvVariableEditor rows={envVars} onChange={setEnvVars} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <Button variant="ghost" onClick={() => setStep("repo")}>
              <ArrowLeft data-icon="inline-start" />
              Back
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!projectName.trim() || creating}
            >
              {creating ? (
                <>
                  <SpinnerGap data-icon="inline-start" className="animate-spin" />
                  Creating…
                </>
              ) : (
                "Create project"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
