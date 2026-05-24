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
