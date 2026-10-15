import { redactSecrets } from "./github-repo";
import { publishLog } from "../services/logs";

export function redactBuildSecrets(message: string, env: Record<string, string>): string {
  const secrets = Object.values(env)
    .flatMap((value) => [value, ...value.split(/\r?\n/)])
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  return redactSecrets(message, ...secrets);
}

/** Buffer complete lines so a value split across output chunks is still masked. */
export function createBuildLogWriter(deploymentId: string, env: Record<string, string>) {
  let pending = "";

  function emit(line: string) {
    const safe = redactBuildSecrets(line, env);
    process.stdout.write(`${safe}\n`);
    publishLog(deploymentId, safe, "build");
  }

  return {
    write(chunk: string) {
      pending += chunk;
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) emit(line);
    },
    flush() {
      if (pending) emit(pending);
      pending = "";
    },
  };
}
