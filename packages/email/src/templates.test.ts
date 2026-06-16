import { describe, expect, test } from "vitest";
import { loginEmailHtml, passwordResetEmailHtml, signupEmailHtml } from "./templates";

const DASHBOARD = "http://localhost:3000";
const LOGO_CID = "sailboat-logo";

describe("email templates", () => {
  test("signup template includes name, dashboard link, and inline logo", () => {
    const html = signupEmailHtml({ name: "Alex", dashboardUrl: DASHBOARD, logoCid: LOGO_CID });

    expect(html).toContain("Welcome to Fleet");
    expect(html).toContain("Hi Alex");
    expect(html).toContain(`href="${DASHBOARD}"`);
    expect(html).toContain(`src="cid:${LOGO_CID}"`);
    expect(html).toContain("Open dashboard");
  });

  test("signup template uses dark palette colors", () => {
    const html = signupEmailHtml({ name: "Alex", dashboardUrl: DASHBOARD, logoCid: LOGO_CID });

    expect(html).toContain("#1a1a18");
    expect(html).toContain("#252525");
    expect(html).toContain("#f3f1eb");
    expect(html).toContain("#a7a39a");
  });

  test("password-reset template includes OTP code, expiry, and reset link", () => {
    const html = passwordResetEmailHtml({
      name: "Alex",
      code: "482910",
      expiresMinutes: 15,
      dashboardUrl: DASHBOARD,
      logoCid: LOGO_CID,
    });

    expect(html).toContain("Reset your password");
    expect(html).toContain("Hi Alex");
    expect(html).toContain("482910");
    expect(html).toContain("15 minutes");
    expect(html).toContain(`href="${DASHBOARD}/reset-password"`);
    expect(html).toContain(`src="cid:${LOGO_CID}"`);
    expect(html).toContain("Go to reset page");
  });

  test("login template includes sign-in time and inline logo", () => {
    const html = loginEmailHtml({
      name: "Alex",
      loginTime: "Jun 16, 2026, 10:30 AM UTC",
      dashboardUrl: DASHBOARD,
      logoCid: LOGO_CID,
    });

    expect(html).toContain("New sign-in detected");
    expect(html).toContain("Hi Alex");
    expect(html).toContain("Jun 16, 2026, 10:30 AM UTC");
    expect(html).toContain(`href="${DASHBOARD}"`);
    expect(html).toContain(`src="cid:${LOGO_CID}"`);
    expect(html).toContain("Go to dashboard");
  });
});
