See [../README.md](../README.md) for the canonical project documentation.

---

1. User signs up
2. User creates Project (repo, branch, server, subdomain) — API only writes DB
3. User triggers deploy (or auto on create)
   → API creates Deployment(status: queued), enqueues ONE job
4. Worker/Agent:
   a. clone repo at commitSha
   b. detect runtime / build Dockerfile (or use template)
   c. docker build → tag → push to registry (local GHCR for dev)
   d. WebSocket/API: status building → deploying
   e. docker run on target server (agent message type: "deploy")
   f. status live + URL (subdomain routing)
5. API serves status/logs via DB + agent events

6. Sign up / auth
7. Create project (repo, branch, server, subdomain) — metadata only
8. Create deployment (commit or branch head) — status: queued
9. Worker runs pipeline: clone → build image → push registry → deploy container
10. Agent reports status + logs; API updates Deployment; user gets URL when live
11. Redeploy = new Deployment; rollback = deploy previous imageTag

12. use our managed server for deployment(always this)

api mostly done.
auth jwt done.
next step: deployment
on create project, enqueue a deployment job.
for now:
lets work on simple things first.

1. clone a repo - v1, clone locally in an out dir, only contain safe ones for now, no worries, later we will sandbox it each repo.
2. auto build docker image service.

no idea, how will i do this and what happens after this. lets go.

next steps:

Good news — your foundation is solid. You're not lost, you just need a clear order of attack.

**Your only job right now: one end-to-end deploy, no UI, no GitHub, no agent.**

Forget everything else. The goal is: hit an API endpoint → repo gets cloned → Docker image gets built → container runs → you can curl a port. That's it. Everything else (dashboard, GitHub OAuth, agent, CLI) is built on top of this working.

**Exact order to build:**

**1. BullMQ queue + worker (1-2 days)**

In `apps/api`, when `POST /projects` is called, enqueue a deploy job with `{ projectId, repoUrl }`. Create `apps/worker` — a separate process that picks up that job. Just log "got job" for now. Confirm the job flows from API → Redis → worker.

**2. Git clone in the worker (few hours)**

You already have `simple-git` in deps. In the worker, clone the repo into a temp directory like `/tmp/fleet-builds/{deploymentId}`. Update the `Deployment` status to `cloning` → `cloned` in Mongo as you go.

**3. Docker build in the worker (1 day)**

You have `dockerode`. Point it at the cloned directory, run `docker build`, tag the image `fleet/{projectId}:{deploymentId}`. Stream build output and save logs to the `Deployment` doc. Status → `building` → `built` or `failed`.

**4. Docker run (few hours)**

Still in the worker — run the built image, let Docker assign a random host port, save that port to the `Deployment` doc. Status → `running`. Now you can `curl localhost:{port}` and hit the app.

**5. Wire a status endpoint**

`GET /api/v1/deployments/:id` → returns status, logs, port. This is how you'll verify everything worked without a UI.

---

That's your next ~5 days of work. Once you can do this with a test repo that has a Dockerfile, you have the hard part done. Traefik routing, GitHub OAuth, dashboard, runtime detection — all of that snaps on after.

**Make a dead-simple test repo right now** — a Node or Python app with a hand-written Dockerfile that just serves "hello world" on port 3000. Use that as your target until step 5 works. Don't test with real repos until the pipeline is proven.

https://github.com/mondeep31/fleet-test-repo-1/

use this to test
