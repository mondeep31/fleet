import { describe, expect, test } from "vitest";
import { buildAppUrl, buildAppUrlFromEnv } from "./routing";

describe("buildAppUrl", () => {
  test("builds local HTTP URL with Traefik port", () => {
    expect(
      buildAppUrl("my-app", {
        appsDomain: "localhost",
        scheme: "http",
        publicPort: "18080",
      }),
    ).toBe("http://my-app.localhost:18080");
  });

  test("omits port for HTTPS production URLs", () => {
    expect(
      buildAppUrl("my-app", {
        appsDomain: "apps.example.com",
        scheme: "https",
        publicPort: "",
      }),
    ).toBe("https://my-app.apps.example.com");
  });

  test("omits port for HTTP on port 80", () => {
    expect(
      buildAppUrl("my-app", {
        appsDomain: "apps.example.com",
        scheme: "http",
        publicPort: "80",
      }),
    ).toBe("http://my-app.apps.example.com");
  });

  test("buildAppUrlFromEnv uses shared env fields", () => {
    expect(
      buildAppUrlFromEnv("blog", {
        FLEET_APPS_DOMAIN: "localhost",
        FLEET_PUBLIC_URL_SCHEME: "http",
        FLEET_TRAEFIK_PUBLIC_PORT: "18080",
      }),
    ).toBe("http://blog.localhost:18080");
  });
});
