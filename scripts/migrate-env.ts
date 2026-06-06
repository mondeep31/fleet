import { copyFileSync, existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dir, "..");
const rootEnv = resolve(repoRoot, ".env");
const rootExample = resolve(repoRoot, ".env.example");
const apiEnv = resolve(repoRoot, "apps/api/.env");

function normalizeEnvValue(key: string, value: string): string {
  const prefix = `${key}=`;
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

function parseEnvFile(content: string): Map<string, string> {
  const vars = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = normalizeEnvValue(key, trimmed.slice(eq + 1).trim());
    vars.set(key, value);
  }
  return vars;
}

function serializeEnv(lines: string[], vars: Map<string, string>): string {
  const written = new Set<string>();
  const out: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      out.push(line);
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      out.push(line);
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (vars.has(key)) {
      out.push(`${key}=${vars.get(key)}`);
      written.add(key);
    } else {
      out.push(line);
    }
  }

  for (const [key, value] of vars) {
    if (!written.has(key)) {
      out.push(`${key}=${value}`);
    }
  }

  return `${out.join("\n").replace(/\n*$/, "")}\n`;
}

function isEmptyValue(value: string | undefined): boolean {
  return value === undefined || value === "";
}

if (!existsSync(rootEnv)) {
  if (existsSync(rootExample)) {
    copyFileSync(rootExample, rootEnv);
    console.log("created .env from .env.example");
  } else {
    writeFileSync(rootEnv, "");
    console.log("created empty .env");
  }
}

const rootLines = readFileSync(rootEnv, "utf8").split("\n");
const rootVars = parseEnvFile(readFileSync(rootEnv, "utf8"));

if (existsSync(apiEnv)) {
  const apiVars = parseEnvFile(readFileSync(apiEnv, "utf8"));
  const migrated: string[] = [];

  for (const [key, value] of apiVars) {
    if (isEmptyValue(rootVars.get(key))) {
      rootVars.set(key, value);
      migrated.push(key);
    }
  }

  if (migrated.length > 0) {
    writeFileSync(rootEnv, serializeEnv(rootLines, rootVars));
    for (const key of migrated) {
      console.log(`migrated ${key} from apps/api/.env`);
    }
  } else {
    console.log("no keys to migrate from apps/api/.env");
  }

  unlinkSync(apiEnv);
  console.log("deleted apps/api/.env");
} else {
  console.log("apps/api/.env not found, skipped merge");
}

console.log("env migration complete");
