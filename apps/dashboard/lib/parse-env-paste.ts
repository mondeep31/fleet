export interface ParsedEnvEntry {
  key: string;
  value: string;
}

const ENV_KEY_VALUE_PATTERN = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseEnvLine(line: string): ParsedEnvEntry | null {
  const trimmed = line.replace(/\r$/, "").trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const match = ENV_KEY_VALUE_PATTERN.exec(trimmed);
  if (!match) return null;

  const key = match[1];
  const rawValue = match[2].trim();
  return { key, value: unquote(rawValue) };
}

export function parseEnvPaste(text: string): ParsedEnvEntry[] {
  const entries: ParsedEnvEntry[] = [];
  for (const line of text.split("\n")) {
    const parsed = parseEnvLine(line);
    if (parsed) entries.push(parsed);
  }
  return entries;
}

export function looksLikeEnvPaste(text: string): boolean {
  if (text.includes("\n") || text.includes("\r")) {
    return parseEnvPaste(text).length > 0;
  }
  return ENV_KEY_VALUE_PATTERN.test(text.trim());
}
