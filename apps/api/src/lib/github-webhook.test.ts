import crypto from "node:crypto";
import { describe, test, expect } from "vitest";
import {
  verifyGitHubSignature,
  parsePushEvent,
  extractBranchFromRef,
} from "./github-webhook";

// ---------------------------------------------------------------------------
// verifyGitHubSignature
// ---------------------------------------------------------------------------

function makeSignature(body: Buffer, secret: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifyGitHubSignature", () => {
  const secret = "test-secret";
  const body = Buffer.from('{"ref":"refs/heads/main"}');

  test("returns true for valid signature", () => {
    const sig = makeSignature(body, secret);
    expect(verifyGitHubSignature(body, sig, secret)).toBe(true);
  });

  test("returns false for wrong secret", () => {
    const sig = makeSignature(body, "wrong-secret");
    expect(verifyGitHubSignature(body, sig, secret)).toBe(false);
  });

  test("returns false for tampered body", () => {
    const sig = makeSignature(body, secret);
    expect(verifyGitHubSignature(Buffer.from("tampered"), sig, secret)).toBe(false);
  });

  test("returns false when signature is undefined", () => {
    expect(verifyGitHubSignature(body, undefined, secret)).toBe(false);
  });

  test("returns false for empty string signature", () => {
    expect(verifyGitHubSignature(body, "", secret)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parsePushEvent
// ---------------------------------------------------------------------------

const VALID_PUSH = {
  ref: "refs/heads/main",
  repository: {
    clone_url: "https://github.com/acme/app.git",
    html_url: "https://github.com/acme/app",
    full_name: "acme/app",
  },
  head_commit: { id: "abc123", message: "fix bug" },
  deleted: false,
};

describe("parsePushEvent", () => {
  test("parses a valid push payload", () => {
    const result = parsePushEvent(VALID_PUSH);
    expect(result).not.toBeNull();
    expect(result?.ref).toBe("refs/heads/main");
    expect(result?.repository.clone_url).toBe("https://github.com/acme/app.git");
    expect(result?.deleted).toBe(false);
  });

  test("returns null for non-object", () => {
    expect(parsePushEvent(null)).toBeNull();
    expect(parsePushEvent("string")).toBeNull();
  });

  test("returns null when ref is missing", () => {
    const { ref: _ref, ...rest } = VALID_PUSH;
    expect(parsePushEvent(rest)).toBeNull();
  });

  test("returns null when repository is missing", () => {
    const { repository: _repo, ...rest } = VALID_PUSH;
    expect(parsePushEvent(rest)).toBeNull();
  });

  test("handles null head_commit (push delete)", () => {
    const result = parsePushEvent({ ...VALID_PUSH, head_commit: null });
    expect(result?.head_commit).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// extractBranchFromRef
// ---------------------------------------------------------------------------

describe("extractBranchFromRef", () => {
  test("extracts branch from heads ref", () => {
    expect(extractBranchFromRef("refs/heads/main")).toBe("main");
    expect(extractBranchFromRef("refs/heads/feat/my-feature")).toBe("feat/my-feature");
  });

  test("returns null for tag refs", () => {
    expect(extractBranchFromRef("refs/tags/v1.0.0")).toBeNull();
  });

  test("returns null for other refs", () => {
    expect(extractBranchFromRef("refs/pull/1/head")).toBeNull();
  });
});
