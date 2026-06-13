/**
 * PM2 ecosystem for Fleet production deployment.
 *
 * CI/CD example:
 *   bun install
 *   bun run --cwd apps/dashboard build
 *   pm2 startOrReload ecosystem.config.cjs --env production
 *   pm2 save
 *
 * Prerequisites on the host:
 *   - Bun installed
 *   - Root `.env` populated (loaded by @fleet/config at runtime)
 *   - `docker compose up -d` for Redis + Traefik
 *
 * Start locally (development env):
 *   pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: "fleet-api",
      cwd: "./apps/api",
      script: "src/index.ts",
      interpreter: "bun",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      kill_timeout: 10_000,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "fleet-worker",
      cwd: "./apps/worker",
      script: "src/index.ts",
      interpreter: "bun",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      kill_timeout: 10_000,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "fleet-dashboard",
      cwd: "./apps/dashboard",
      script: "bun",
      args: "run start",
      interpreter: "none",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      kill_timeout: 10_000,
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
