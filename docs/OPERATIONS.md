# Fleet operations and readiness

This document defines how Fleet is maintained and the gate it must pass before
opening the platform to untrusted users or AI agents. It is deliberately about
operational evidence, not feature completeness.

## Current readiness assessment — 2026-08-03

**Verdict:** suitable for continued development and a controlled private demo;
not ready for public, untrusted, or autonomous MCP-driven deployments.

Evidence collected from the repository:

- `bun run test`: **pass** — 29 test files, 183 tests.
- `bun run test:coverage`: **pass**, but measured statement coverage is
  **22.34%**. Many HTTP boundaries and infrastructure integrations are at 0%.
- `bun run test:ui`: **fail** — three React lint errors and three warnings.
- A direct dashboard production build could not complete in the restricted audit
  environment because `next/font` fetches four Google font families at build
  time. The build also reports an ambiguous workspace root and a deprecated
  Next.js middleware convention. Make the build hermetic or explicitly provide
  its network dependency before treating it as reproducible.
- No checked-in CI workflow currently enforces tests, lint, build, or security
  checks on every change.
- `/health` only proves that the API process can answer HTTP; it does not check
  MongoDB, Redis, the worker, Docker, Traefik, queue progress, or disk pressure.
- The deploy pipeline declares a container live when Docker reports `Running`;
  it does not prove that the application answers HTTP.
- Builds and runtime containers share one Docker host. Runtime limits reduce
  risk but do not make arbitrary user build instructions strongly isolated.

## Go/no-go gates

### Gate A — green repository

- [ ] A pull request cannot merge unless unit tests, dashboard lint, dashboard
  build, API build, and worker type/build checks pass.
- [ ] `bun run test:ui` passes locally and in CI.
- [ ] Production builds are reproducible from a clean checkout. Self-host
  required fonts/build assets, set the Next.js workspace root explicitly, and
  migrate the deprecated middleware convention.
- [ ] Add route-level integration tests for authentication, authorization,
  validation, and error responses.
- [ ] Add an end-to-end smoke test: create project → build → readiness → live
  URL → logs → redeploy → stop.
- [ ] Protect the default branch and require the CI checks.

### Gate B — safe deployments

- [ ] A new container cannot receive production traffic before HTTP readiness
  passes.
- [ ] A failed build or failed readiness check leaves the last healthy
  deployment serving.
- [ ] Rollback is tested and completes without rebuilding source.
- [ ] Rapid pushes converge on the latest commit. A push received during a build
  must be queued/coalesced, not silently discarded.
- [ ] Deploy creation is idempotent and project-scoped concurrency is enforced
  atomically rather than by a read-then-create race.
- [ ] Build, clone, readiness, deploy, and cancellation timeouts are enforced.
- [ ] Old images, containers, source directories, queue jobs, and logs have
  explicit retention policies and automated cleanup.

### Gate C — security baseline

- [ ] Every resource endpoint has an ownership/role check with cross-user tests.
- [ ] Login, signup, password reset, OAuth starts, webhook traffic, project
  creation, deploys, and log streams have appropriate rate/concurrency limits.
- [ ] Add standard HTTP security headers and explicit proxy/origin policy.
- [ ] Do not reveal whether an email account exists during login/reset flows.
- [ ] Define JWT/session revocation for password changes and compromised users.
- [ ] Run dependency and secret scanning in CI.
- [ ] Threat-model Docker builds, the Docker socket, container networking,
  metadata endpoints, fork bombs, disk exhaustion, outbound abuse, and log-based
  secret leakage.
- [ ] Do not admit arbitrary public builds until build isolation is stronger
  than a shared privileged Docker daemon.

### Gate D — observable and recoverable

- [ ] Replace the shallow health endpoint with separate liveness and readiness
  endpoints. Readiness checks MongoDB and Redis and confirms that a worker
  heartbeat is recent.
- [ ] Track and alert on API error rate, queue depth/age, deploy success rate,
  deploy duration, worker heartbeat, host memory, CPU, disk, inode usage,
  container count, and certificate/domain failures.
- [ ] Centralize structured API, worker, and deployment lifecycle logs with
  request, project, deployment, and job correlation IDs.
- [ ] Back up MongoDB and all non-recreatable configuration/secrets.
- [ ] Document Redis durability expectations; queue state may be disposable only
  if MongoDB reconciliation can recover stuck deployments.
- [ ] Test restore into a clean environment. A backup that has not been restored
  is not considered verified.
- [ ] Add startup reconciliation for stuck deployments, orphan containers,
  missing Traefik network attachments, and queue/DB disagreement.
- [ ] Write and rehearse runbooks for worker down, Mongo/Redis unavailable,
  disk full, bad release, leaked secret, Traefik recreation, and mass deploy
  failure.

### Gate E — MCP admission

- [ ] Gates A–D pass in production for at least two weeks of controlled use.
- [ ] MCP tokens are hashed, scoped, expiring, revocable, project-restrictable,
  and audited.
- [ ] All MCP mutations use the normal API/queue/promotion path and accept
  idempotency keys.
- [ ] Default MCP access is read-only. Destructive and secret-writing scopes are
  explicit.
- [ ] Per-user and per-token rate limits, deployment budgets, and an emergency
  revoke-all control are proven.
- [ ] Agent-generated bundles are size-limited, checksummed, expiring, scanned,
  and built in the same isolated pipeline as repository sources.

## Maintenance model

The goal is to keep maintenance boring: one release path, a few meaningful
signals, rehearsed recovery, and no special deployment path for MCP.

### On every change

1. CI runs tests, lint, builds, route integration tests, and security scans.
2. Deploy to a staging Fleet installation.
3. Run the end-to-end deploy smoke test against a known fixture repository.
4. Promote the same revision to production.
5. Run production smoke checks and watch error/deploy metrics during a short
   canary window.

Database/schema changes must be backward-compatible for one release so API and
worker processes can roll independently. Queue payloads and MCP tool schemas are
versioned contracts; additive changes are preferred.

### Daily — automated

- Check liveness/readiness, worker heartbeat, oldest queued job, failed jobs,
  disk/inodes, container count, and certificate/domain status.
- Alert only on actionable symptoms with a linked runbook.
- Reconcile DB deployment state against queue and Docker state.
- Remove expired source artifacts and enforce retention limits.

### Weekly — operator review

- Review failed/slow deployments, auth anomalies, agent audit events, resource
  saturation, and support reports.
- Review dependency/security alerts and schedule upgrades.
- Confirm backups completed and inspect cleanup effectiveness.
- Exercise one staging rollback.

### Monthly

- Restore the latest backup into an isolated environment and run smoke tests.
- Rotate eligible credentials and verify emergency token revocation.
- Patch the host, Docker, Bun, and base images through staging first.
- Review capacity trends and the top recurring deployment failure reasons.
- Revisit limits using observed workloads instead of raising them ad hoc.

## Suggested initial service objectives

These are starting targets for a small installation, not contractual promises:

- Fleet API/dashboard availability: **99.5% monthly**.
- Queue-to-build-start latency: **95% under 60 seconds** when capacity is
  available.
- Control-plane deploy success for known-good fixture apps: **99%**.
- Failed candidate changes production traffic: **0 occurrences**.
- Restore point objective: **24 hours** initially; improve before paid use.
- Restore time objective: **4 hours** initially.

Measure these before advertising an SLA. User-code build failures do not count
as control-plane failures, but Fleet must classify the difference reliably.

## Ownership as the project grows

Even with one maintainer, assign a named owner for each production week. That
owner handles releases, alerts, incident notes, and backup verification. Keep a
small change log and record incidents in `docs/CONTEXT.md` when they change an
architecture decision or expose a repeated operational hazard.

Avoid separate MCP infrastructure at first. MCP should be a thin, versioned
adapter over the same application services used by the dashboard and API. This
keeps authorization, limits, audit, deployment semantics, and fixes in one
place.
