import { describe, expect, test } from "vitest";
import { getDockerBuildArgs } from "./build-env";

describe("getDockerBuildArgs", () => {
  test("uses dashboard values for declared args and leaves runtime secrets out", () => {
    const dockerfile = `FROM node:22-alpine AS builder
ARG BACKEND_URL=http://127.0.0.1:8080
ARG NEXT_PUBLIC_USE_MOCK_DATA=
RUN npm run build
FROM node:22-alpine
ARG BACKEND_URL
`;
    expect(getDockerBuildArgs(dockerfile, {
      BACKEND_URL: "https://backend.example.com",
      NEXT_PUBLIC_USE_MOCK_DATA: "",
      DATABASE_URL: "postgres://private-password@db/app",
    })).toEqual({
      BACKEND_URL: "https://backend.example.com",
      NEXT_PUBLIC_USE_MOCK_DATA: "",
    });
  });

  test("handles continued, case-insensitive, and multiple args with quoted defaults", () => {
    const dockerfile = [
      "# ARG DATABASE_URL",
      "FROM node:22-alpine",
      "arg LABEL=\"hello DATABASE_URL world\" BACKEND_URL \\",
      "# an intervening comment",
      "NEXT_PUBLIC_FLAG",
    ].join("\r\n");
    expect(getDockerBuildArgs(dockerfile, {
      LABEL: "label", BACKEND_URL: "url", NEXT_PUBLIC_FLAG: "true", DATABASE_URL: "secret",
    })).toEqual({ LABEL: "label", BACKEND_URL: "url", NEXT_PUBLIC_FLAG: "true" });
  });

  test("respects the Dockerfile escape directive and preserves undeclared defaults", () => {
    const dockerfile = "# escape=`\nFROM node:22-alpine\nARG BACKEND_URL `\nNEXT_PUBLIC_FLAG=default\n";
    expect(getDockerBuildArgs(dockerfile, { BACKEND_URL: "url", OTHER: "secret" }))
      .toEqual({ BACKEND_URL: "url" });
    expect(getDockerBuildArgs(dockerfile, {})).toEqual({});
  });
});
