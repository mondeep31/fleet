import { SAILBOAT_PNG_BASE64 } from "@fleet/brand";
import { getSharedEnv } from "@fleet/config";
import { getResendClient } from "./client";
import { loginEmailHtml, passwordResetEmailHtml, signupEmailHtml } from "./templates";

interface SendSignupEmailParams {
  to: string;
  name: string;
}

interface SendLoginEmailParams {
  to: string;
  name: string;
  loginAt?: Date;
}

function formatLoginTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

// Inline CID used in both the template HTML and the attachment descriptor.
const LOGO_CID = "sailboat-logo";

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const { RESEND_FROM_EMAIL } = getSharedEnv();
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to,
    subject,
    html,
    attachments: [
      {
        filename: "sailboat.png",
        content: Buffer.from(SAILBOAT_PNG_BASE64, "base64"),
        contentId: LOGO_CID,
      },
    ],
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendSignupEmail({
  to,
  name,
}: SendSignupEmailParams): Promise<void> {
  const { DASHBOARD_URL } = getSharedEnv();
  await sendEmail({
    to,
    subject: "Welcome to Fleet",
    html: signupEmailHtml({
      name,
      dashboardUrl: DASHBOARD_URL,
      logoCid: LOGO_CID,
    }),
  });
}

export async function sendLoginEmail({
  to,
  name,
  loginAt = new Date(),
}: SendLoginEmailParams): Promise<void> {
  const { DASHBOARD_URL } = getSharedEnv();
  await sendEmail({
    to,
    subject: "New sign-in to Fleet",
    html: loginEmailHtml({
      name,
      loginTime: `${formatLoginTime(loginAt)} UTC`,
      dashboardUrl: DASHBOARD_URL,
      logoCid: LOGO_CID,
    }),
  });
}

interface SendPasswordResetEmailParams {
  to: string;
  name: string;
  code: string;
}

export async function sendPasswordResetEmail({
  to,
  name,
  code,
}: SendPasswordResetEmailParams): Promise<void> {
  const { DASHBOARD_URL } = getSharedEnv();
  await sendEmail({
    to,
    subject: "Your Fleet password reset code",
    html: passwordResetEmailHtml({
      name,
      code,
      expiresMinutes: 15,
      dashboardUrl: DASHBOARD_URL,
      logoCid: LOGO_CID,
    }),
  });
}
