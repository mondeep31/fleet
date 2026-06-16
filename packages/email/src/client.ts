import { Resend } from "resend";
import { getSharedEnv } from "@fleet/config";

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendClient) {
    const { RESEND_API_KEY } = getSharedEnv();
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}
