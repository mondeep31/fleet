import type { SharedEnv } from "./env";

export interface BuildAppUrlOptions {
  appsDomain: string;
  scheme: "http" | "https";
  publicPort?: string;
}

export function buildAppUrl(
  subdomain: string,
  options: BuildAppUrlOptions,
): string {
  const host = `${subdomain}.${options.appsDomain}`;
  const port = options.publicPort?.trim();

  if (options.scheme === "https") {
    return `https://${host}`;
  }

  if (!port || port === "80") {
    return `http://${host}`;
  }

  return `http://${host}:${port}`;
}

export function buildAppUrlFromEnv(
  subdomain: string,
  env: Pick<
    SharedEnv,
    "FLEET_APPS_DOMAIN" | "FLEET_PUBLIC_URL_SCHEME" | "FLEET_TRAEFIK_PUBLIC_PORT"
  >,
): string {
  return buildAppUrl(subdomain, {
    appsDomain: env.FLEET_APPS_DOMAIN,
    scheme: env.FLEET_PUBLIC_URL_SCHEME,
    publicPort: env.FLEET_TRAEFIK_PUBLIC_PORT,
  });
}
