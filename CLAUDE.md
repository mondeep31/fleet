# Working in this repo

Fleet is a self-hosted PaaS — Bun monorepo, workspaces under `apps/*` and
`packages/*`. Full behavior/setup docs: [`README.md`](README.md). Current
architecture in detail: [`docs/architecture.md`](docs/architecture.md).
Roadmap decisions and open questions: [`docs/CONTEXT.md`](docs/CONTEXT.md)
— **check this before proposing roadmap, architecture, or "what's next"
work**, and update it when a decision gets made or superseded.

## Ground truth over docs

The README and architecture doc are kept up to date deliberately, but
verify against actual code before relying on either for anything
consequential — `docs/priv/` contains older planning notes that are
frequently stale and should not be treated as current state.

## Running things

- Single root `.env` (not per-app) — validated at startup via
  `@fleet/config`. Copy `.env.example` to start.
- `bun run dev:api` / `dev:worker` / `dev:dashboard` — watch-mode dev
  servers. `dev:agent` / `dev:cli` exist as scripts but those apps have no
  implementation yet.
- `docker compose up -d` — Redis (`16379`) and Traefik (`18080` web,
  `18081` dashboard).
- `bun test` — Vitest suite, runs via git hooks on commit and push
  (`.githooks/`, installed with `bun run setup:hooks`).

## Known gaps (don't assume these exist)

`apps/agent` and `apps/cli` are dependency-only, zero implementation.
`Server` and `Environment` Mongoose models exist but nothing uses them —
deploys are hardcoded to `serverId: "local"` / `environmentId: "default"`.
No custom domains, no automated TLS/ACME, no rollback despite a
`rolled_back` status enum value, no billing beyond a disabled UI button.
Full list: `docs/architecture.md#roadmap--not-yet-implemented`.
