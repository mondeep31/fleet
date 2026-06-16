import { describe, test, expect } from "vitest";
import {
  DEFAULT_CONTAINER_PORT,
  normalizePort,
  parsePortFromEnvEntries,
  resolveContainerPortFromImageConfig,
} from "./container-port";

describe("normalizePort", () => {
  test("adds /tcp suffix to bare port", () => {
    expect(normalizePort("3000")).toBe("3000/tcp");
  });

  test("preserves existing protocol suffix", () => {
    expect(normalizePort("8080/tcp")).toBe("8080/tcp");
  });
});

describe("parsePortFromEnvEntries", () => {
  test("reads PORT from env array", () => {
    expect(parsePortFromEnvEntries(["NODE_ENV=production", "PORT=8080"])).toBe(
      "8080/tcp",
    );
  });

  test("returns null when PORT is absent", () => {
    expect(parsePortFromEnvEntries(["NODE_ENV=production"])).toBeNull();
  });
});

describe("resolveContainerPortFromImageConfig", () => {
  test("prefers ExposedPorts metadata", () => {
    expect(
      resolveContainerPortFromImageConfig({
        ExposedPorts: { "3001/tcp": {} },
        Env: ["PORT=8080"],
      }),
    ).toBe("3001/tcp");
  });

  test("uses runtime PORT when image has no exposed ports", () => {
    expect(
      resolveContainerPortFromImageConfig({ Env: ["PORT=3000"] }, "9000"),
    ).toBe("9000/tcp");
  });

  test("uses image PORT env when no exposed ports or runtime override", () => {
    expect(
      resolveContainerPortFromImageConfig({
        Env: ["NODE_ENV=production", "PORT=8080"],
      }),
    ).toBe("8080/tcp");
  });

  test("defaults to 3000 for railpack images without EXPOSE metadata", () => {
    expect(resolveContainerPortFromImageConfig({ Env: ["NODE_ENV=production"] })).toBe(
      DEFAULT_CONTAINER_PORT,
    );
  });
});
