interface EmailLayoutParams {
  preview: string;
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  dashboardUrl: string;
  logoCid: string;
}

function emailLayout({
  preview,
  heading,
  body,
  ctaLabel,
  ctaUrl,
  dashboardUrl,
  logoCid,
}: EmailLayoutParams): string {
  const cta =
    ctaLabel && ctaUrl
      ? `<tr>
            <td style="padding-top: 28px;">
              <a href="${ctaUrl}"
                 style="display: inline-block; background: #f7f5ee; color: #1a1a18; text-decoration: none; padding: 11px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; letter-spacing: -0.01em;">
                ${ctaLabel}
              </a>
            </td>
          </tr>`
      : "";

  const logoSrc = `cid:${logoCid}`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${heading}</title>
  </head>
  <body style="margin: 0; padding: 0; background: #1a1a18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #f3f1eb;">
    <span style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preview}&nbsp;‌&zwnj;&nbsp;‌&zwnj;&nbsp;‌&zwnj;&nbsp;‌&zwnj;&nbsp;‌&zwnj;</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #1a1a18; padding: 48px 16px 64px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
            style="max-width: 540px; background: #252525; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden;">
            <!-- header -->
            <tr>
              <td style="padding: 32px 36px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="width: 38px; height: 38px; background: linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 100%); border: 1px solid rgba(255,255,255,0.12); border-radius: 9px; text-align: center; vertical-align: middle;">
                      <img src="${logoSrc}" width="20" height="20" alt="Fleet" style="display: block; margin: 9px auto;" />
                    </td>
                    <td style="padding-left: 12px;">
                      <span style="font-size: 13px; font-weight: 600; color: #f3f1eb; letter-spacing: -0.01em;">fleet</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- divider -->
            <tr>
              <td style="padding: 24px 36px 0;">
                <div style="height: 1px; background: rgba(255,255,255,0.08);"></div>
              </td>
            </tr>
            <!-- body -->
            <tr>
              <td style="padding: 28px 36px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                  <tr>
                    <td>
                      <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; line-height: 1.3; color: #f3f1eb; letter-spacing: -0.02em;">${heading}</h1>
                      <div style="font-size: 15px; line-height: 1.65; color: #a7a39a;">${body}</div>
                    </td>
                  </tr>
                  ${cta}
                </table>
              </td>
            </tr>
            <!-- footer -->
            <tr>
              <td style="padding: 28px 36px 32px;">
                <div style="height: 1px; background: rgba(255,255,255,0.08); margin-bottom: 24px;"></div>
                <p style="margin: 0; font-size: 12px; color: #6b6965; line-height: 1.5;">
                  Fleet &mdash; deploy from GitHub.<br/>
                  You received this email because an action was taken on your account.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function signupEmailHtml({
  name,
  dashboardUrl,
  logoCid,
}: {
  name: string;
  dashboardUrl: string;
  logoCid: string;
}): string {
  return emailLayout({
    preview: "Your Fleet account is ready.",
    heading: "Welcome to Fleet",
    body: `<p style="margin: 0 0 10px; color: #f3f1eb;">Hi ${name},</p>
<p style="margin: 0;">Your account is set up. Start creating projects and deploying apps straight from GitHub.</p>`,
    ctaLabel: "Open dashboard",
    ctaUrl: dashboardUrl,
    dashboardUrl,
    logoCid,
  });
}

export function passwordResetEmailHtml({
  name,
  code,
  expiresMinutes,
  dashboardUrl,
  logoCid,
}: {
  name: string;
  code: string;
  expiresMinutes: number;
  dashboardUrl: string;
  logoCid: string;
}): string {
  return emailLayout({
    preview: "Your Fleet password reset code.",
    heading: "Reset your password",
    body: `<p style="margin: 0 0 10px; color: #f3f1eb;">Hi ${name},</p>
<p style="margin: 0 0 20px;">We received a request to reset your Fleet account password. Use the code below:</p>
<p style="margin: 0 0 20px; font-size: 32px; font-weight: 700; letter-spacing: 0.18em; font-family: 'Courier New', Courier, monospace; color: #f3f1eb;">${code}</p>
<p style="margin: 0 0 10px;">This code expires in <span style="color: #f3f1eb; font-weight: 500;">${expiresMinutes} minutes</span>. You have 3 attempts before the code is invalidated.</p>
<p style="margin: 0;">If you did not request a password reset, you can ignore this email — your password will not change.</p>`,
    ctaLabel: "Go to reset page",
    ctaUrl: `${dashboardUrl}/reset-password`,
    dashboardUrl,
    logoCid,
  });
}

export function loginEmailHtml({
  name,
  loginTime,
  dashboardUrl,
  logoCid,
}: {
  name: string;
  loginTime: string;
  dashboardUrl: string;
  logoCid: string;
}): string {
  return emailLayout({
    preview: "A new sign-in to your Fleet account was detected.",
    heading: "New sign-in detected",
    body: `<p style="margin: 0 0 10px; color: #f3f1eb;">Hi ${name},</p>
<p style="margin: 0 0 10px;">We detected a sign-in to your account on <span style="color: #f3f1eb; font-weight: 500;">${loginTime}</span>.</p>
<p style="margin: 0;">If this was you, no action is needed. If you did not sign in, update your password from account settings immediately.</p>`,
    ctaLabel: "Go to dashboard",
    ctaUrl: dashboardUrl,
    dashboardUrl,
    logoCid,
  });
}
