import { describe, expect, test } from "vitest";
import { looksLikeEnvPaste, parseEnvPaste } from "./parse-env-paste";

describe("parseEnvPaste", () => {
  test("parses KEY=value", () => {
    expect(parseEnvPaste("DATABASE_URL=postgres://localhost")).toEqual([
      { key: "DATABASE_URL", value: "postgres://localhost" },
    ]);
  });

  test("parses KEY = value with spaces around equals", () => {
    expect(parseEnvPaste("API_KEY = sk-123")).toEqual([
      { key: "API_KEY", value: "sk-123" },
    ]);
  });

  test("parses multiple lines", () => {
    expect(parseEnvPaste("A=1\nB = 2\nNODE_ENV=production")).toEqual([
      { key: "A", value: "1" },
      { key: "B", value: "2" },
      { key: "NODE_ENV", value: "production" },
    ]);
  });

  test("skips blank lines and # comments", () => {
    expect(parseEnvPaste("# comment\n\nFOO=bar\n# another")).toEqual([
      { key: "FOO", value: "bar" },
    ]);
  });

  test("strips export prefix", () => {
    expect(parseEnvPaste("export SECRET=abc")).toEqual([
      { key: "SECRET", value: "abc" },
    ]);
  });

  test("strips double quotes from value", () => {
    expect(parseEnvPaste('MSG="hello world"')).toEqual([
      { key: "MSG", value: "hello world" },
    ]);
  });

  test("strips single quotes from value", () => {
    expect(parseEnvPaste("MSG='hello'")).toEqual([
      { key: "MSG", value: "hello" },
    ]);
  });

  test("preserves equals signs inside value", () => {
    expect(parseEnvPaste("URL=https://x.com?a=1&b=2")).toEqual([
      { key: "URL", value: "https://x.com?a=1&b=2" },
    ]);
  });

  test("handles Windows CRLF line endings", () => {
    expect(parseEnvPaste("A=1\r\nB=2\r\n")).toEqual([
      { key: "A", value: "1" },
      { key: "B", value: "2" },
    ]);
  });

  test("returns empty array for text with no valid entries", () => {
    expect(parseEnvPaste("just some text\n# only comments\n")).toEqual([]);
  });
});

describe("looksLikeEnvPaste", () => {
  test("returns true for a single KEY=value line", () => {
    expect(looksLikeEnvPaste("FOO=bar")).toBe(true);
  });

  test("returns true for KEY = value with spaces", () => {
    expect(looksLikeEnvPaste("FOO = bar")).toBe(true);
  });

  test("returns true for multi-line env block", () => {
    expect(looksLikeEnvPaste("A=1\nB=2")).toBe(true);
  });

  test("returns false for plain text without equals", () => {
    expect(looksLikeEnvPaste("just some text")).toBe(false);
  });

  test("returns false for a bare key with no equals", () => {
    expect(looksLikeEnvPaste("MY_KEY")).toBe(false);
  });

  test("returns false for multi-line text with no valid env lines", () => {
    expect(looksLikeEnvPaste("hello world\nfoo bar")).toBe(false);
  });
});
