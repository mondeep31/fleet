export const DEFAULT_CONTAINER_PORT = "3000/tcp";

export function normalizePort(port: string): string {
  const trimmed = port.trim();
  if (trimmed.includes("/")) {
    return trimmed;
  }
  return `${trimmed}/tcp`;
}

export function parsePortFromEnvEntries(entries: string[] | undefined): string | null {
  if (!entries) {
    return null;
  }

  for (const entry of entries) {
    const match = entry.match(/^PORT=(.+)$/);
    if (match?.[1]) {
      return normalizePort(match[1]);
    }
  }

  return null;
}

export function resolveContainerPortFromImageConfig(
  config: {
    ExposedPorts?: Record<string, unknown>;
    Env?: string[];
  },
  runtimePort?: string,
): string {
  const exposed = Object.keys(config.ExposedPorts ?? {});
  if (exposed.length > 0) {
    return exposed[0]!;
  }

  if (runtimePort) {
    return normalizePort(runtimePort);
  }

  const fromImageEnv = parsePortFromEnvEntries(config.Env);
  if (fromImageEnv) {
    return fromImageEnv;
  }

  return DEFAULT_CONTAINER_PORT;
}
