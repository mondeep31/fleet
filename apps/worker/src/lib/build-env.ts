/**
 * Only explicitly declared Docker build arguments receive dashboard values.
 * Undeclared variables remain runtime-only. Build arguments are intended for
 * public configuration; use BuildKit secret mounts for build credentials.
 */
export function getDockerBuildArgs(
  dockerfile: string,
  env: Record<string, string>,
): Record<string, string> {
  const escape = dockerfile.match(/^\s*#\s*escape\s*=\s*([\\`])\s*$/im)?.[1] ?? "\\";
  const continuation = new RegExp(`${escape === "\\" ? "\\\\" : "`"}\\r?\\n`, "g");
  const instructions = dockerfile
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith("#"))
    .join("\n")
    .replace(continuation, " ");
  const names = new Set<string>();

  for (const line of instructions.split("\n")) {
    const declaration = line.match(/^\s*ARG\s+(.+)$/i)?.[1];
    if (!declaration) continue;
    // Keep quoted defaults together, including defaults containing spaces.
    const tokens = declaration.match(/(?:[^\s"'\\]|\\.|"(?:[^"\\]|\\.)*"|'[^']*')+/g) ?? [];
    for (const token of tokens) {
      const name = token.split("=", 1)[0]!;
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) names.add(name);
    }
  }

  return Object.fromEntries(Object.entries(env).filter(([key]) => names.has(key)));
}
