# Fleet product TODO

This is the execution-oriented product backlog. Architecture details live in
[`docs/architecture.md`](docs/architecture.md), and decisions/context live in
[`docs/CONTEXT.md`](docs/CONTEXT.md). The production readiness gate and ongoing
maintenance schedule live in [`docs/OPERATIONS.md`](docs/OPERATIONS.md).

## P0 — Make the current deploy path safe

- [ ] Make the repository green and enforce it in CI.
  - Fix the current dashboard lint failures.
  - Require unit tests, dashboard lint/build, API build, and route integration
    tests before merge.
  - Make the dashboard build reproducible without fetching Google Fonts, set
    the Next.js workspace root explicitly, and migrate deprecated middleware.
- [ ] Add production liveness/readiness endpoints and a worker heartbeat.
- [ ] Add a repeatable end-to-end deploy smoke test using a fixture repository.
- [ ] Enforce deployment ownership on deployment detail and status endpoints.
  - An authenticated user must not be able to read another user's deployment by
    guessing its ID.
  - Cover detail, status, stop, and log access with cross-user tests.
- [ ] Add HTTP readiness checks before promoting a candidate container.
  - Support a configurable health path, timeout, and expected status range.
  - Do not expose the candidate through Traefik until the check passes.
  - Keep the current production container serving if the candidate fails.
  - Report readiness attempts in deployment logs.
- [ ] Make deployment state match reality.
  - `live` must mean the app passed readiness and receives production traffic.
  - A failed candidate must say that the previous deployment remains live.
- [ ] Add one-click rollback to a previously successful deployment.
  - Recreate from the selected deployment image, run the same readiness gate,
    and only then cut over traffic.
  - Record who/what initiated the rollback and mark the resulting deployment.
- [ ] Add retention and cleanup for old images, containers, clone directories,
  and deployment logs.
- [ ] Coalesce GitHub pushes received during a deployment so the latest commit
  is deployed after the in-progress job instead of being silently skipped.
- [ ] Add rate limits, security headers, structured audit logging, backup/restore
  verification, monitoring, alerts, and incident runbooks.

## P1 — Let people connect AI agents through MCP

### Product contract

Users can create a scoped Fleet token, connect Fleet as a remote MCP server in
their coding agent, and let that agent create, deploy, inspect, redeploy, roll
back, and stop applications on the user's behalf.

MCP is the control plane. Large source trees should be supplied through a Git
repository or a short-lived signed source-upload URL, not embedded in MCP tool
arguments.

### MCP server foundation

- [ ] Add `apps/mcp` as a remote MCP server using Streamable HTTP.
- [ ] Publish a stable endpoint such as `https://fleet.example.com/mcp`.
- [ ] Add personal access tokens with:
  - hashed storage and one-time plaintext display;
  - name, creation time, last-used time, expiry, and revocation;
  - scopes such as `projects:read`, `projects:write`, `deployments:write`,
    `logs:read`, `domains:write`, and `secrets:write`;
  - optional restriction to selected projects.
- [ ] Add a dashboard page to create, inspect, rotate, and revoke agent tokens.
- [ ] Rate-limit MCP sessions and mutating tool calls per user/plan.
- [ ] Write an audit event for every agent action with user, token, tool,
  target, arguments summary, result, IP, and timestamp.

### MCP tools — first release

- [ ] `fleet_projects_list`
- [ ] `fleet_project_get`
- [ ] `fleet_project_create_from_repo`
- [ ] `fleet_deploy` — deploy a repo/branch/commit to a new or existing project.
- [ ] `fleet_deployment_get`
- [ ] `fleet_deployment_logs`
- [ ] `fleet_deployment_stop`
- [ ] `fleet_deployment_rollback`
- [ ] `fleet_domains_list`
- [ ] `fleet_domain_add`

Every mutating tool should accept an idempotency key and return a stable
operation/deployment ID so an agent can safely retry after a timeout.

### Agent-generated applications

- [ ] Add a source bundle deployment flow for agents that generate code without
  first pushing to GitHub.
  1. Agent calls `fleet_source_upload_create` with project metadata.
  2. Fleet returns a short-lived, single-use signed upload URL and size limit.
  3. Agent uploads a `.tar.gz` source bundle directly.
  4. Agent calls `fleet_deploy_source` with the returned source artifact ID.
  5. Fleet scans, builds with Railpack or a Dockerfile, readiness-checks, and
     promotes the result through the normal deployment pipeline.
- [ ] Store source artifacts in object storage with checksum verification,
  strict size limits, expiry, and automatic deletion.
- [ ] Allow an agent to create an ephemeral preview first, then explicitly
  promote that exact artifact to production.
- [ ] Return structured build errors and suggested next actions so agents can
  repair a project and retry autonomously.

### Safety boundaries for agent deploys

- [ ] Default new tokens to read-only; deployment and secret scopes require an
  explicit user choice.
- [ ] Never return secret values through MCP. Agents may set or replace a secret
  only when the token has `secrets:write`.
- [ ] Require confirmation or a separately granted scope for destructive actions
  such as deleting a project, removing a domain, or stopping production.
- [ ] Enforce build time, CPU, memory, PID, disk, network, artifact-size, and
  concurrent-deployment limits before allowing general agent access.
- [ ] Add per-project deployment locks plus idempotency to prevent an agent loop
  from creating a deployment storm.
- [ ] Provide an emergency account-level “revoke all agent access” control.

### MCP release definition of done

- A user can copy one MCP configuration snippet into a compatible coding agent.
- The agent can create a project from a GitHub repository, deploy it, follow
  structured status/log output, and return the live URL.
- The agent can upload and deploy a generated source bundle without GitHub.
- Every action is scoped, rate-limited, auditable, revocable, and safe to retry.
- A failed or unhealthy agent deployment never replaces the last healthy app.

## P2 — Public showcase readiness

- [ ] Complete and live-test the Cloudflare for SaaS operator setup.
- [ ] Test the full custom-domain lifecycle against real Cloudflare responses.
- [ ] Add deployment failure and recovery notifications by email; add Slack
  after the event model is stable.
- [ ] Add an operator view for queue depth, worker health, build duration,
  failure rate, disk usage, and active containers.
- [ ] Add abuse controls and plan quotas before opening self-service signup.
- [ ] Surface commit SHA, commit message, initiator (`user`, `github`, `mcp`),
  and “production unchanged” state in deployment history.

## P3 — Platform expansion

- [ ] Preview deployments for pull requests and arbitrary branches.
- [ ] First-class environments (`production`, `preview`, `staging`) instead of
  the current `default` placeholder.
- [ ] Push images to a registry so deployments are not tied to one Docker host.
- [ ] Implement the remote server agent and activate the existing `Server`
  model.
- [ ] Add a CLI built on the same API/auth/audit primitives as MCP.
- [ ] Support monorepo root directories and Dockerfiles outside the repo root.
- [ ] Teams, shared projects, roles, and approval policies.
- [ ] Billing only after usage metering and enforcement are trustworthy.

## Not next

- Do not prioritize billing, teams, or a broad marketplace before readiness,
  rollback, isolation, quotas, and auditability are in place.
- Do not let MCP bypass the existing deployment queue or worker. Human, GitHub,
  CLI, and MCP deploys should all produce the same Deployment record and use the
  same safe promotion pipeline.
