# Context & planning log

Purpose: a running decision log for where Fleet goes next, separate from
[`README.md`](../README.md) (how to run it today) and
[`architecture.md`](architecture.md) (what exists today). Update this file
as decisions get made or superseded — don't let it silently rot like the
README did.

## Current goal

Get Fleet to a state that can be shown publicly (portfolio/showcase, and
potentially real outside users), starting from: self-hosted on one Ubuntu
box, GitHub-connect deploy flow, wildcard tunnel URL per project.

## Snapshot: verified gaps (2026-07-26)

Confirmed by reading the actual code, not the old README claims. Full list
lives in `architecture.md`'s roadmap table; the ones that matter for a
public showcase:

- **No custom domains** — users are stuck on a subdomain of the operator's
  domain. Every comparable product (Vercel/Railway/Render) treats this as
  table stakes.
- **No automated TLS** — wildcard HTTPS today is a manual nginx + certbot
  setup in front of Traefik (`production-deploy-urls.md`), not app code.
- **No rollback** — `rolled_back` is a defined `Deployment` status with zero
  code path that sets it. A bad deploy just sits there; the previous live
  container isn't torn down until the *next* successful deploy.
- **No real health check** — "live" means "container reported Running
  within 30s," not "the app responds to a request."
- **Single shared Docker daemon** — every user's Dockerfile builds and runs
  on the operator's one box. Sandboxing exists (`CapDrop: ["ALL"]`,
  no-new-privileges, memory/CPU/pids limits) but this is not full tenant
  isolation. This is the biggest risk of inviting the general public in
  before addressing it further — it's a shared blast radius for arbitrary
  user-supplied code.
- **`apps/agent` and `apps/cli`** — package.json only, zero implementation.
- **`Server` and `Environment` Mongoose models exist but are unused** —
  everything is hardcoded to `serverId: "local"` / `environmentId:
  "default"`. This is relevant to the BYO-server idea below: the schema
  already anticipates it.

## Decision: custom domains — build it, via Cloudflare for SaaS

Scoped, self-contained, doesn't depend on the BYO-server question below.

**Superseded plan**: the original idea (self-issue Let's Encrypt certs via
Traefik/Caddy ACME, HTTP-01 challenge) does **not** work for this
deployment. The Ubuntu box sits behind a VPN with no public inbound port —
it's only reachable via **Cloudflare Tunnel**. HTTP-01 requires Let's
Encrypt to reach port 80 on the box directly, which is impossible here by
design. DNS-01 doesn't work either since it needs DNS API access to the
*customer's* zone, which we'll never have.

**Actual plan: Cloudflare for SaaS (custom hostnames).** Confirmed
available on the **free Cloudflare plan** — 100 free custom hostnames,
$0.10/mo each beyond that, up to 50,000 total. (Wildcard custom hostnames
are Enterprise-only, but irrelevant here — each project gets one specific
domain, not a customer-owned wildcard.)

Flow: user adds `app.theirdomain.com` → Fleet calls the Cloudflare API to
register it as a custom hostname on our zone, pointing at a **fallback
origin** (a proxied CNAME on our zone → a Cloudflare Tunnel public hostname
→ Traefik on `127.0.0.1:18080`, same pattern the wildcard domain already
uses) → Cloudflare returns the ownership-verification record to show the
user → a poll job checks Cloudflare's hostname status until `active` →
Cloudflare's edge now terminates TLS for that domain (their cert, not
ours) and forwards into our tunnel with the original Host header intact →
Traefik needs a router for that host (added via a dynamic provider, not
docker labels, so no redeploy is needed per domain).

This means **zero changes** to `apps/worker`, `buildTraefikLabels`,
`docker-compose.yml`, or the box's network exposure — the box stays fully
private. Cloudflare owns the entire TLS/cert/DNS-ownership problem.

**Status: fully wired in-app (2026-07-26).** Implemented:
- `Domain` model (`packages/db/src/models/domain.ts`) — `projectId`,
  `domain` (globally unique), `cloudflareHostnameId`, `status`
  (`pending`/`active`/`error`/`deleted`), `sslStatus`,
  `ownershipVerification` (raw Cloudflare record shown to the user), `error`.
- `packages/domains` — new shared package holding the Cloudflare API client
  (`cloudflare-client.ts`, moved out of `apps/api`) and the sync core
  (`sync.ts`: `refreshCloudflareStatus` — ownership-agnostic status refresh;
  `syncActiveDomainRouting` — rewrites Traefik's file-provider config from
  all `active` domains). Shared because both `apps/api` (manual verify) and
  `apps/worker` (periodic sweep) need it. `CLOUDFLARE_API_TOKEN`/
  `CLOUDFLARE_ZONE_ID` moved from API-only to `sharedEnvSchema` for the same
  reason — both stay optional, feature 503s cleanly if unset rather than
  breaking startup.
- `apps/api/src/services/domain.ts` — thin ownership-checked wrapper around
  `@fleet/domains`: add/list/refresh/remove. Routes unchanged:
  `GET/POST /api/v1/projects/:projectId/domains`,
  `POST .../domains/:domainId/verify`, `DELETE .../domains/:domainId`.
- **Background sweep** (`apps/worker/src/jobs/domain-verify.ts`): a BullMQ
  repeatable job (`DOMAIN_VERIFY_QUEUE`, `packages/queue`) scheduled via
  `upsertJobScheduler` every 30s, refreshes every `pending` `Domain` against
  Cloudflare, then rewrites Traefik's routing once per sweep.
- **Traefik dynamic routing**: `docker-compose.yml` now bind-mounts
  `FLEET_TRAEFIK_DYNAMIC_DIR` into the Traefik container at `/dynamic` and
  adds `--providers.file.directory=/dynamic --providers.file.watch=true`.
  `syncActiveDomainRouting()` writes one router per active domain there,
  referencing the existing docker-discovered service
  (`fleet{projectId}@docker` — same naming scheme as `buildTraefikLabels`
  in `apps/worker/src/steps/run.ts`), so redeploys never touch domain
  routing and adding/removing a domain never touches the container.
- **Dashboard UI**: `apps/dashboard/components/projects/domains-card.tsx`,
  wired into the project detail page next to `EnvVariablesCard`. Add/list/
  manual-"check now"/remove, polls while any domain is `pending` (same
  conditional-`refreshInterval` pattern as `use-projects.ts`).

**Remaining — outside this repo, operator-only** (Cloudflare account
access required, can't be automated from the codebase):
1. Enable Cloudflare for SaaS on the `mondeep.xyz` zone.
2. Add a fallback-origin public hostname on the existing Cloudflare Tunnel
   (routed to `localhost:18080`, same target Traefik already listens on)
   and set it as the zone's Cloudflare for SaaS fallback origin.
3. Create a scoped Cloudflare API token (`Zone:SSL and Certificates:Edit` +
   `Zone:Custom Hostnames:Edit`, restricted to the zone) and put it plus the
   zone ID in production `.env`.
4. Point `FLEET_TRAEFIK_DYNAMIC_DIR` at a persistent directory in production
   (not `/tmp`) and create it before first start.
5. Restart Traefik after the `docker-compose.yml` change so it picks up the
   new file provider.

Also still open: the exact Cloudflare API response shape used in
`cloudflare-client.ts` (`ownership_verification` vs.
`ownership_verification_http`, `ssl.status` values) was implemented from
documented conventions, not yet checked against a live response — the
first real `addCustomDomain` call against the zone is the actual
verification of that contract.

## Open question: BYO-server / "environment manager" pivot

Idea from a collaborator: instead of the operator hosting everyone's
containers, ship a lightweight agent that a user installs on their *own*
VPS. Fleet becomes an orchestration control plane; compute and blast radius
move to the user's box. Reframes the product from "dev tool that deploys
for you" to "environment manager that sits in your infra."

**This is not a foreign pivot** — it's finishing something already
half-designed and stalled: the `Server` model (ip, agentToken, resource
totals) and `apps/agent` (WebSocket + dockerode deps, message types already
defined in `packages/types/src/agent.ts`) exist for exactly this, and it's
listed in `architecture.md`'s own roadmap. Nobody has built it.

Tradeoffs:

| | Today (operator hosts) | After (agent on user's server) |
|---|---|---|
| Onboarding | Connect GitHub, done | Also install/run an agent on their own VPS |
| Compute/bandwidth cost | Operator's | User's |
| Security blast radius of arbitrary user Dockerfiles | Shared, on operator's one box | Contained to the user's own box |
| Scaling | Operator must size up as users grow | No ceiling tied to operator's instance |
| Routing/TLS | One shared Traefik, solved once | Per-host Traefik + ACME, or a proxy tier — needs design |
| Implementation cost | — | Abstract `apps/worker`'s dockerode calls behind a dispatch layer; build `apps/agent` from scratch (ideally the agent dials *out* over WebSocket so users don't need to open inbound ports, à la Tailscale/Coolify); rework routing |

This is comparable in scope to a second worker build, not a bolt-on. It's a
legitimate, previously-validated product category (CapRover/Coolify/Dokploy
all work this way) and arguably reduces cost + liability more than any
other single change — but it's a deliberate fork, not something to mix
into incremental work on the current single-server path.

**Status: undecided.** Recommendation when this comes up again: treat it as
its own milestone/spike, not a background task alongside custom domains or
other Phase 4 items.

## Other things noted but not yet actioned

- Billing: dashboard has a disabled "Coming soon" upgrade button; no
  Stripe/payment code anywhere. Fine for a showcase, blocks monetization.
  Compute limits (`packages/config/plans.ts`) already gate resources by
  `User.plan`, so plan enforcement exists even without payment collection.
- Dockerfile in subdirectories: only repo-root `Dockerfile`/`dockerfile` is
  detected; Railpack fallback handles no-Dockerfile repos but not nested
  ones.
- Registry push (GHCR): images are local `docker build` tags only. Needed
  before any multi-server/agent work, since a remote agent can't build and
  run on the same host — images need to be pushed somewhere the target
  host can pull from.
