import type { DeploymentLogEntry, DeploymentLogSource } from "./types";

const LOG_SOURCES = new Set<DeploymentLogSource>([
  "build",
  "pipeline",
  "runtime",
]);

function isLogSource(value: string): value is DeploymentLogSource {
  return LOG_SOURCES.has(value as DeploymentLogSource);
}

export function parseLogFields(
  fields: string[],
): DeploymentLogEntry | null {
  const record: Record<string, string> = {};
  for (let index = 0; index < fields.length; index += 2) {
    const key = fields[index];
    const value = fields[index + 1];
    if (key && value !== undefined) {
      record[key] = value;
    }
  }

  const line = record.line;
  const source = record.source;
  if (!line || !source || !isLogSource(source)) {
    return null;
  }

  return { line, source };
}
