import { sendLoginEmail, sendPasswordResetEmail, sendSignupEmail } from "@fleet/email";
import type { EmailJobPayload } from "@fleet/queue";

export async function handleEmailJob(payload: EmailJobPayload): Promise<void> {
  switch (payload.type) {
    case "signup":
      await sendSignupEmail({ to: payload.to, name: payload.name });
      break;
    case "login":
      await sendLoginEmail({
        to: payload.to,
        name: payload.name,
        loginAt: payload.loginAt ? new Date(payload.loginAt) : undefined,
      });
      break;
    case "password-reset":
      await sendPasswordResetEmail({
        to: payload.to,
        name: payload.name,
        code: payload.code,
      });
      break;
    default: {
      const unexpected: never = payload;
      throw new Error(`Unhandled email job type: ${(unexpected as { type: string }).type}`);
    }
  }
}
